const fs = require('fs')
const path = require('path')
require("dag-loader")
module.exports = class DagEntryPlugin {

    constructor({ path, glob, filename }) {
        if (!path || !filename) {
            throw Error("path and filename options required")
        }

        this.path = path
        this.glob = glob
        this.filename = filename
    }

    apply (compiler) {
        
        compiler.hooks.afterEmit.tapAsync("DagEntryPlugin", (compilation, callback) => {

            const root = path.isAbsolute(this.path) ? this.path : path.join(compiler.context, this.path)
            const isRootADirectory = fs.lstatSync(root).isDirectory()
            
            //Add path query if directory and add glob if passed in
            const requestParams = 
                (isRootADirectory ? `?path=${root}` : '?') + 
                (this.glob ? `&glob=${this.glob}` : '')
            const requestFile = isRootADirectory ? "" : root
            const outputPath = compilation.outputOptions.path || compiler.context

            compiler.webpack({ 
                entry: {
                    //Add params and if root is a file add to request
                    dag: `dag-loader${requestParams}!${requestFile}`
                },
                target: 'node',
                output: {
                    path: outputPath,
                    filename: this.filename,
                    library: 'dag',
                    libraryTarget: 'umd',
                    globalObject: 'this'
                }
            }, (err, stats) => {
                
                if (err) callback(err)

                const info = stats.toJson();
                if (stats.hasErrors()) callback(info.errors);

                try {
                    const resultPath = path.join(outputPath, this.filename)

                    delete require.cache[resultPath]
                    const { cid } = require(resultPath)

                    const logger = compilation.getLogger("DagEntryPlugin");                   
                    logger.info("⬡ DagEntryPlugin: ", cid); 
                
                } catch (err) {
                    callback(err)
                }

                callback(null)
            })
        })
    }
}
