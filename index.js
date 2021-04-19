const path = require('path')

module.exports = class DagEntryPlugin {

    constructor({ config, filename }) {
        if (!config || !filename) {
            throw Error("config and filename required")
        }

        this.config = config
        this.filename = filename
    }

    apply (compiler) {
        
        compiler.hooks.afterEmit.tapAsync("DagEntryPlugin", (compilation, callback) => {

            compiler.webpack({ 
                entry: {
                    dag: "dag-loader!" + path.join(compiler.context, this.config)
                },
                output: {
                    path: compiler.context,
                    filename: this.filename,
                    library: 'dag',
                    libraryTarget: 'umd',
                    globalObject: 'this'
                }
            }, (err, stats) => {
                
                if (err) callback(err)
                
                const info = stats.toJson();
                
                if (stats.hasErrors()) callback(info.errors);''
                callback(null)
            })
        })
    }
}
