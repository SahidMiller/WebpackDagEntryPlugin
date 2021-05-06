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
                    dag: "dag-loader!" + (path.isAbsolute(this.config) ? 
                        this.config :
                        path.join(compiler.context, this.config)
                    )
                },
                target: 'node',
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
                if (stats.hasErrors()) callback(info.errors);

                try {

                    const { cid, dag } = require(path.join(compiler.context, this.filename))
                    const { links, size } = dag.toJSON()
                                        
                    const logger = compilation.getLogger("DagEntryPlugin");                   
                    logger.info("⬡ DagEntryPlugin: ", cid); 
                    logger.log(JSON.stringify({ cid, links, size }, null, 2));
                
                } catch (err) {
                    callback(err)
                }

                callback(null)
            })
        })
    }
}
