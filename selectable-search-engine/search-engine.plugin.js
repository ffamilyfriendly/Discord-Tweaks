/**
 * @name Selectable-Browser
 * @version 0.0.1
 * @authorLink https://familyfriendly.xyz
 * @website https://familyfriendly.xyz
 * @source https://github.com/ffamilyfriendly/Discord-Tweaks
 */

const { debug } = require("console");

module.exports = (() => {
	const config = {info:{name:"Selectable-Browser",authors:[{name:"Family Friendly",discord_id:"286224826170081290",github_username:"ffamilyfriendly"}],version:"0.0.1",description:"lets you select context menu search button!",github:"https://github.com/ffamilyfriendly/Discord-Tweaks",github_raw:"https://github.com/ffamilyfriendly/Discord-Tweaks"},changelog:[{title:"Changes",items:["Plugin exists","Multiple engines supported"]}], main:"index.js"};

    return !global.ZeresPluginLibrary ? class {
        constructor() {this._config = config;}
        getName() {return config.info.name;}
        getAuthor() {return config.info.authors.map(a => a.name).join(", ");}
        getDescription() {return config.info.description;}
        getVersion() {return config.info.version;}
        load() {
            BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() {}
        stop() {}
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Api) => {
    const {Patcher, Settings, WebpackModules, Toasts, Logger, DiscordContextMenu} = Api;

    const InlineMediaWrapper = WebpackModules.getByProps("ImageReadyStates").default;

    return class CustomEngines extends Plugin {
        constructor() {
			super();
			this.sInterval = null;
        }

		ensureSetting(key,fallbackValue) {
			if(!BdApi.getData(config.info.name,key) || BdApi.getData(config.info.name,key) == "") BdApi.setData(config.info.name,key,fallbackValue)
		}

		setSetting(key,value) {
			BdApi.setData(config.info.name,key,value)
		}

		getSetting(key) {
			Logger.log("asdas",BdApi.getData(config.info.name,key))
			return BdApi.getData(config.info.name,key)
		}

        onStart() {
			this.ensureSetting("search_url","https://duckduckgo.com/%s")
			this.fixContextMenu()
		}

		fixContextMenu() {
			const SettingsContextMenu = WebpackModules.getModule(m => m.default && m.default.displayName == "MessageContextMenu");
			Patcher.after(SettingsContextMenu, "default", (component, args, retVal) => {
				retVal.props.children.forEach(r => {
					if(r.props.children && r.props.children[0] && r.props.children[0].props.id == "search-google") {
						const defaultSE = this.getSetting("search_url")
						Logger.log(defaultSE)
						r.props.children[0].props.label = `Search with ${this.getServiceName(defaultSE)}`
						r.props.children[0].props.action = () => {
							return window.open(this.parseUrl(defaultSE,window.getSelection().toString()),"_blank")
						}
					}
				})
            });
		}

		getServiceName(url) {
			const match = /^(?:https?\:\/\/)?(?:www\.)?([^\.]+)(?:\.).*$/gm.exec(url)
			return match[1]
		}

		parseUrl(url,query) {
			return url.replace("%s",encodeURIComponent(query))
		}
        
        onStop() {

        }

		

        getSettingsPanel() {
			let s = document.createElement("div");
			
			const tBoxOnChange = (t) => {
				if(this.sInterval) clearTimeout(this.sInterval)
				this.sInterval = setTimeout(() => {
					this.setSetting("search_url",t)
					Toasts.success(`Saved value "${t}"`)
					this.sInterval = null
				}, 1000)
			}

			let defaultTextBox = new Settings.Textbox("Default Browser Url","replace the query part (where the search text will go) with \"%s\"",this.getSetting("search_url"),tBoxOnChange)
			s.appendChild(defaultTextBox.getElement())

			let customEngines = new Settings.SettingGroup("Extra Browsers", { shown:true, collapsible:true })
			
			s.appendChild(customEngines.getElement())

            return s
		}

    };
};
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();