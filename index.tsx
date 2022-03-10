module.exports = (Plugin, Library) => {
    "use strict";

    const {Logger, Patcher, WebpackModules, Settings, DiscordModules, Modals, DiscordClassModules, PluginUtilities} = Library;
    const {Dispatcher} = DiscordModules;
    const {SettingPanel, Switch, Keybind} = Settings;
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

    function UploadCompleteModalFunc(link) {
        return <UploadCompleteModal link={link}/>;
    }

    // Settings
    interface Settings {
        syncPlugins: boolean;
        syncPluginSettings: boolean;
        syncThemes: boolean;
        overwrite: boolean;
        syncPushKeys: Array<number>;
        syncPullKeys: Array<number>;
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
            reloadSettings();

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
            `);

            Modals.showModal("Upload Complete!", UploadCompleteModalFunc("test"), {
                confirmText: "Copy",
                cancelText: "Okay",
                onConfirm: () => {
                    require("electron").clipboard.writeText("test");
                }
            });
        };

        onStop() {
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