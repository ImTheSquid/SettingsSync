module.exports = (Plugin, Library) => {
    "use strict";

    const {Logger, Patcher, WebpackModules, ContextMenu, DiscordModules, Modals, DiscordClassModules, PluginUtilities} = Library;
    const {Dispatcher} = DiscordModules;
    const {React, ReactDOM} = BdApi;

    class UploadCompleteModal extends React.Component {
        constructor(props) {
            super(props);
            this.state = {link: props.link, showCopied: false};
            this.handleClick = this.handleClick.bind(this);
        }

        handleClick(e) {
            e.preventDefault();
            Logger.log("COPY!");
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

    interface Settings {
        syncPlugins: boolean;
        syncPluginSettings: boolean;
        syncThemes: boolean;
    }

    // Settings
    const defaultSettings: Settings = {
        syncPlugins: true,
        syncPluginSettings: true,
        syncThemes: true
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

        compressBD(password?: string) {
            const zip = require('minizip-asm.js');
            const glob = require("glob");

            // Collect all specified files
            if (settings.syncPlugins) {

            }

            if (settings.syncPluginSettings) {

            }

            if (settings.syncThemes) {

            }
        }
    };

    return SettingsSync;
}