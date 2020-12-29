/**
 * @name Selectable-Browser
 * @version 0.0.2
 * @authorLink https://familyfriendly.xyz
 * @website https://familyfriendly.xyz
 * @source https://raw.githubusercontent.com/ffamilyfriendly/Discord-Tweaks/master/selectable-search-engine/search-engine.plugin.js
 */

module.exports = (() => {
	const config = {info:{name:"Selectable-Browser",authors:[{name:"Family Friendly",discord_id:"286224826170081290",github_username:"ffamilyfriendly"}],version:"0.0.1",description:"lets you select context menu search button!",github:"https://github.com/ffamilyfriendly/Discord-Tweaks",github_raw:"https://raw.githubusercontent.com/ffamilyfriendly/Discord-Tweaks/master/selectable-search-engine/search-engine.plugin.js"},changelog:[{title:"Changes",items:["Multiple engines supported", "Settings menu"]}], main:"index.js"};

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

    return class CustomEngines extends Plugin {
        constructor() {
			super();
			this.sInterval = null;

			this.css = `
			
			.FF-browser-div {
				padding: 0.5em;
				margin: 0.25em;
				border-radius: 0.35em;
				background-color: #212126;
			}

			.FF-browser-div button {
				display: inline-block;
				margin:0.5em;
			}

			`
        }

		ensureSetting(key,fallbackValue) {
			if(!BdApi.getData(config.info.name,key) || BdApi.getData(config.info.name,key) == "") BdApi.setData(config.info.name,key,fallbackValue)
		}

		setSetting(key,value) {
			BdApi.setData(config.info.name,key,value)
		}

		getSetting(key) {
			return BdApi.getData(config.info.name,key)
		}

        onStart() {
			this.ensureSetting("search_url","https://duckduckgo.com/%s")
			this.ensureSetting("other_browsers",{})
			this.fixContextMenu()
			BdApi.injectCSS(config.info.name, this.css)
		}

		fixContextMenu() {
			const SettingsContextMenu = WebpackModules.getModule(m => m.default && m.default.displayName == "MessageContextMenu");
			Patcher.after(SettingsContextMenu, "default", (component, args, retVal) => {

				if(window.getSelection().toString() == "") return
				Logger.log("context menu", { component, args, retVal })

				//change default browser
				retVal.props.children.forEach(r => {
					if(r.props.children && r.props.children[0] && r.props.children[0].props.id == "search-google") {
						const defaultSE = this.getSetting("search_url")
						r.props.children[0].props.label = `Search with ${this.getServiceName(defaultSE)}`
						r.props.children[0].props.action = () => {
							return window.open(this.parseUrl(defaultSE,window.getSelection().toString()),"_blank")
						}
					}
				})

				//add misc browsers
				const browsers = this.getSetting("other_browsers")
				if(!browsers) return
				const browserKeys = Object.keys(browsers)
				let sItems = []
				retVal.props.children.push(DiscordContextMenu.buildMenuItem({type: "separator"}));
				for(let i = 0; i < browserKeys.length; i++) {
					if(!browsers[browserKeys[i]].on) continue;

					retVal.props.children.push(DiscordContextMenu.buildMenuItem({label: `Search with ${this.getServiceName(browsers[browserKeys[i]].url)}`, action: () => {return window.open(this.parseUrl(browsers[browserKeys[i]].url,window.getSelection().toString()),"_blank");}}));

					/*sItems.push({
						label: this.getServiceName(browsers[browserKeys[i]].url),
						id: browserKeys[i],
						subtext:browsers[browserKeys[i]].url,
						closeOnClick: false,
						disabled: false,
						action: () => {return window.open(this.parseUrl(browsers[browserKeys[i]].url,window.getSelection().toString()),"_blank");}
				   	})*/
				}

				if(sItems.length > 0) {
					//retVal.props.children.push(DiscordContextMenu.buildMenuItem({type: "separator"}));
					//retVal.props.children.push(DiscordContextMenu.buildMenuItem({type: "submenu", label:"Search with...", items:sItems  }));
					//Logger.log("context menu", { component, args, retVal })
				}



            });
		}

		getServiceName(url) {
			const match = /^(?:https?\:\/\/)?(?:www\.)?([^\.]+)(?:\.).*$/gm.exec(url)
			if(!match || match.length < 1) return "INVALID URL"
			return match[1]
		}

		parseUrl(url,query) {
			if(!url.includes("%s")) return "https://error.com"
			return url.replace("%s",encodeURIComponent(query))
		}
        
        onStop() {
			BdApi.clearCSS(config.info.name)
        }

		genBrowserTextBox(value,key) {

			let toggle = value.on
			let url = value.url

			let bToggle = new Settings.Switch("Browser Toggle", "wheter or not the browser should appear in context menu",value.on,(t) => { toggle = t })
			let bUrl = new Settings.Textbox("Browser Url", "replace the query part (where the search text will go) with \"%s\"",value.url,(t) => { url = t })

			let container = document.createElement("div")

			const saveBrowser = () => {
				Logger.log("SAVE",key)
				Logger.log("SAVE",{toggle, url})
				let optionsB = this.getSetting("other_browsers")
				if(!optionsB[key]) optionsB[key] = { url:"https://test.com", on:false }
				optionsB[key].url = url
				optionsB[key].on = toggle

				this.setSetting("other_browsers", optionsB)
				Toasts.success("Saved Browser!")
			}

			const deleteBrowser = () => {
				Logger.log("DELETE",key)
				let optionsB = this.getSetting("other_browsers")
				if(!optionsB[key]) return
				delete optionsB[key]
				this.setSetting("other_browsers", optionsB)
				container.remove()
				Toasts.success("Removed Browser!")
			}

			let saveButton = document.createElement("button")
			saveButton.innerText = "Save"
			saveButton.classList = "button-38aScr da-button lookFilled-1Gx00P colorBrand-3pXr91 sizeSmall-2cSMqn grow-q77ONN da-grow"
			saveButton.onclick = saveBrowser

			let removeButton = document.createElement("button")
			removeButton.innerText = "Remove"
			removeButton.classList = "button-38aScr da-button lookFilled-1Gx00P colorRed-1TFJan sizeSmall-2cSMqn grow-q77ONN da-grow"
			removeButton.onclick = deleteBrowser


			container.classList = "FF-browser-div"
			container.appendChild(bToggle.getElement())
			container.appendChild(bUrl.getElement())
			container.appendChild(saveButton)
			container.appendChild(removeButton)

			return container
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
			
			let addButton = document.createElement("button")
			addButton.innerText = "Add a Browser"
			addButton.classList = "button-38aScr da-button lookFilled-1Gx00P colorBrand-3pXr91 sizeSmall-2cSMqn grow-q77ONN da-grow"
			
			addButton.onclick = () => {
				let newBrowser = this.genBrowserTextBox({ on:false, url:"https://urlhere.com/%s" },btoa(Math.random()))
				customEngines.append(newBrowser)
			}

			customEngines.append(addButton)

			let others = this.getSetting("other_browsers")
			let otherKeys = Object.keys(others)

			for(let i = 0; i< otherKeys.length; i++) {
				let nElem = this.genBrowserTextBox(others[otherKeys[i]],otherKeys[i])
				customEngines.append(nElem)
			}

			s.appendChild(customEngines.getElement())

            return s
		}

    };
};
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();