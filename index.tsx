module.exports = (Plugin, Library) => {
    "use strict";

    const {Logger, Patcher, WebpackModules, Settings, DiscordModules, Modals, DiscordClassModules, PluginUtilities} = Library;
    const {Dispatcher} = DiscordModules;
    const {SettingPanel, Switch} = Settings;
    const {React, ReactDOM} = BdApi;

    class UploadCompleteModal extends React.Component {
        constructor(props) {
            super(props);
            this.state = {link: props.link, showCopied: false};
            this.handleClick = this.handleClick.bind(this);
        }

        handleClick(e) {
            e.preventDefault();
            require("electron").clipboard.writeText(this.state.link);
            this.setState(oldState => oldState["showCopied"] = true);
        }

        render() {
            return (
            <div className={DiscordClassModules.Titles.defaultColor}>
                <h3>Your plugins, themes, and related settings have now been uploaded to tmp.ninja. To retrieve your files, open SettingsSync settings on your other client and paste in this link:</h3>
                <h2 className="clickToHighlight link" onClick={this.handleClick}>
                    <strong>{this.state.link}</strong>
                </h2>
                {this.state.showCopied &&
                    <p className="copied">Copied!</p>
                }
            </div>
            );
        }
    }

    class MenuModal extends React.Component {
        constructor(props) {
            super(props);
        }

        render() {
            return (
                <p>Hi</p>
            );
        }
    }

    const SyncIconButton = () => {
        return (
            <svg x="0" y="0" aria-hidden="false" width="24" height="24" viewBox="0 0 24 24" class="icon">
                <path fill="currentColor" d="M21.5,14.98c-0.02,0-0.03,0-0.05,0.01C21.2,13.3,19.76,12,18,12c-1.4,0-2.6,0.83-3.16,2.02C13.26,14.1,12,15.4,12,17 c0,1.66,1.34,3,3,3l6.5-0.02c1.38,0,2.5-1.12,2.5-2.5S22.88,14.98,21.5,14.98z M10,4.26v2.09C7.67,7.18,6,9.39,6,12 c0,1.77,0.78,3.34,2,4.44V14h2v6H4v-2h2.73C5.06,16.54,4,14.4,4,12C4,8.27,6.55,5.15,10,4.26z M20,6h-2.73 c1.43,1.26,2.41,3.01,2.66,5l-2.02,0C17.68,9.64,16.98,8.45,16,7.56V10h-2V4h6V6z"/>
            </svg>
        );
    }

    // Settings
    interface Settings {
        syncPlugins: boolean;
        syncPluginSettings: boolean;
        syncThemes: boolean;
        overwrite: boolean;
    }

    const defaultSettings: Settings = {
        syncPlugins: true,
        syncPluginSettings: true,
        syncThemes: true,
        overwrite: false
    };

    let settings: Settings = defaultSettings;
    const reloadSettings = () => {
        settings = PluginUtilities.loadSettings("SettingsSync", defaultSettings);
    };

    class SettingsSync extends Plugin {
        onStart() {
            this.headerBar = WebpackModules.find(mod => mod.default?.displayName === "HeaderBarContainer");
            this.clickable = WebpackModules.find(mod => mod.default?.displayName === "Clickable");

            reloadSettings();

            Patcher.after(this.headerBar.default.prototype, "renderLoggedIn", (_, [arg], ret) => {
                ret.props.toolbar.props.children.push(React.createElement(this.clickable.default, {
                    "aria-label": "SettingsSync", 
                    className: `iconWrapper clickable`,
                    onClick: this.openSyncModal,
                    role: "button"
                }, [<SyncIconButton/>]));
            });

            BdApi.injectCSS("SettingsSync", `
                .clickToHighlight {
                    user-select: all;
                }

                .copied {
                    color: green;
                    margin-bottom: 0;
                }

                .link {
                    margin-top: 10px;
                }

                .iconWrapper {
                    margin: 0 8px;
                    flex: 0 0 auto;
                    height: 24px;
                }

                .clickable {
                    cursor: pointer;
                }

                .icon {
                    color: var(--interactive-normal);
                }

                .clickable:hover .icon {
                    color: var(--interactive-hover);
                }
            `);
        };

        openSyncModal() {
            Modals.showModal("SettingsSync Menu", <MenuModal/>, {});
        }

        onStop() {
            Patcher.unpatchAll();
            BdApi.clearCSS("SettingsSync");
        };

        getSettingsPanel() {
            reloadSettings();

            return new SettingPanel(() => { PluginUtilities.saveSettings("SettingsSync", settings); },
                new Switch("Sync Plugins", "Include plugins in synchronization.", settings.syncPlugins, on => { settings.syncPlugins = on; }),
                new Switch("Sync Plugins Settings", "Include plugin settings in synchronization.", settings.syncPluginSettings, on => { settings.syncPluginSettings = on; }),
                new Switch("Sync Themes", "Include themes in synchronization.", settings.syncThemes, on => { settings.syncThemes = on; }),
                new Switch("Overwrite Data", "Overwrite local data on sync.", settings.overwrite, on => { settings.overwrite = on; })
            ).getElement();
        }

        compressBD(password?: string) {
            const Minizip = require('minizip-asm.js');
            const glob = require("glob");
            const path = require("path");

            let zipFile = new Minizip();

            let options = {
                encoding: "utf-8"
            }
            if (password != null) {
                options["password"] = password;
            }

            // Collect all specified files
            let paths: Array<string> = [];
            if (settings.syncPlugins) {
                paths.push(...glob.sync(path.join(BdApi.Plugins.folder, "*.plugin.js")));
            }

            if (settings.syncPluginSettings) {
                paths.push(...glob.sync(path.join(BdApi.Plugins.folder, "*.config.json")));
            }

            for (const pathStr of paths) {
                zipFile.append(`plugins/${path.basename(pathStr)}`, pathStr, options);
            }

            if (settings.syncThemes) {
                const paths = glob.sync(path.join(BdApi.Themes.folder, "*.theme.css"));
                for (const pathStr of paths) {
                    zipFile.append(`themes/${path.basename(pathStr)}`, pathStr, options);
                }
            }
        }
    };

    return SettingsSync;
}