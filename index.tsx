module.exports = (Plugin, Library) => {
    "use strict";

    const {Logger, Patcher, WebpackModules, Settings, DiscordModules, Modals, DiscordClassModules, PluginUtilities} = Library;
    const {SettingPanel, Switch} = Settings;
    const {React} = BdApi;

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

    function SwitchButton(props) {
        return (
            <button onClick={props.onClick} className="switchButton">
                {...props.children}
                <p>{props.title}</p>
            </button>
        );
    }

    function MainMenu(props) {
        return (
            <div className="mainMenu">
                <SwitchButton title="Download" onClick={() => { props.onClick(0); }}>
                    <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24">
                        <g><rect/></g><g><path d="M5,20h14v-2H5V20z M19,9h-4V3H9v6H5l7,7L19,9z"/></g>
                    </svg>
                </SwitchButton>
                <SwitchButton title="Upload" onClick={() => { props.onClick(2); }}>
                    <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24">
                        <g><rect/></g><g><path d="M5,20h14v-2H5V20z M5,10h4v6h6v-6h4l-7-7L5,10z"/></g>
                    </svg>
                </SwitchButton>
            </div>
        );
    }

    class UploadMenu extends React.Component {
        constructor(props) {
            super(props);
            this.onUploadClicked = this.onUploadClicked.bind(this);
            this.state = {
                isUploading: false
            }
        }

        onUploadClicked() {
            this.setState({isUploading: true});
        }

        renderUploadReady(listItems: Array<any>) {
            return (
                <div className="uploadReady">
                    <p className="uploadHeader">Upload Manifest:</p>
                    <ul>
                        {...listItems}
                    </ul>

                    <p class="uploadHeaderNotTop">Password (Optional):</p>
                    <input type="password" className="uploadPassword"/>
                </div>
            );
        }

        renderCantUpload() {
            return (
                <p className="cantUpload">Looks like you don't have anything selected to upload! You can change this in the SettingsSync plugin settings.</p>
            )
        }

        render() {
            let listItems: Array<any> = [];

            if (settings.syncPlugins) {
                listItems.push(<li>Plugins</li>)
            }
            if (settings.syncPluginSettings) {
                listItems.push(<li>Plugin Settings</li>)
            }
            if (settings.syncThemes) {
                listItems.push(<li>Themes</li>)
            }
            if (settings.syncMeta) {
                listItems.push(<li>BD Metadata</li>)
            }

            return (
                <div>
                    {listItems.length > 0 && this.renderUploadReady(listItems)}
                    {listItems.length == 0 && this.renderCantUpload()}
                </div>
            );
        }
    }

    class DownloadMenu extends React.Component {
        constructor(props) {
            super(props);
        }

        render() {
            return (
                <div >
                    <p>DOWNLOAD</p>
                </div>
            );
        }
    }

    class MenuModal extends React.Component {
        constructor(props) {
            super(props);
            this.slidesMod = props.slidesMod;
            this.state = {activeSlide: 1};
            this.onMenuChange = this.onMenuChange.bind(this);
        }

        onMenuChange(target) {
            this.setState({activeSlide: target});
        }

        render() {
            Logger.log(this.slidesMod);
            return React.createElement(this.slidesMod, {
                activeSlide: this.state.activeSlide, 
                springConfig: {clamp: true, friction: 20, tension: 210},
                width: 400
            },[
                <div id={0} children={<DownloadMenu/>}/>,
                <div id={1} children={<MainMenu onClick={this.onMenuChange}/>}/>,
                <div id={2} children={<UploadMenu/>}/>
            ]);
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
        syncMeta: boolean;
        overwrite: boolean;
    }

    const defaultSettings: Settings = {
        syncPlugins: true,
        syncPluginSettings: true,
        syncThemes: true,
        syncMeta: true,
        overwrite: false
    };

    let settings: Settings = defaultSettings;
    const reloadSettings = () => {
        settings = PluginUtilities.loadSettings("SettingsSync", defaultSettings);
    };

    async function compressBD(password?: string): Promise<string> {
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

        if (settings.syncMeta) {
            const paths = glob.sync(path.join(BdApi.Plugins.folder, "../data/stable", "*.*"));
            for (const pathStr of paths) {
                zipFile.append(`stable/${path.basename(pathStr)}`, pathStr, options);
            }
        }

        // Write to temporary file
        const fs = require("fs");
        const id = require("crypto").randomBytes(16).toString("hex");
        const tempFolder = await fs.mkdtemp(path.join(require("os").tmpdir(), `ss-upload-${id}`));

        await fs.writeFile(path.join(tempFolder, "upload.zip"), zipFile.zip());

        // Upload file to tmp.ninja and get response

        return "";
    }

    class SettingsSync extends Plugin {
        onStart() {
            this.headerBar = WebpackModules.find(mod => mod.default?.displayName === "HeaderBarContainer");
            this.clickable = WebpackModules.find(mod => mod.default?.displayName === "Clickable");
            this.slides = WebpackModules.find(mod => mod.hasOwnProperty("Slides"));

            reloadSettings();

            Patcher.after(this.headerBar.default.prototype, "renderLoggedIn", (_, [arg], ret) => {
                ret.props.toolbar.props.children.push(React.createElement(this.clickable.default, {
                    "aria-label": "SettingsSync", 
                    className: `iconWrapper clickable`,
                    onClick: this.openSyncModal.bind(this),
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

                .mainMenu {
                    display: flex;
                    flex-direction: row;
                }

                .switchButton {
                    width: 50%;
                    background-color: transparent;
                    border: 3px solid var(--interactive-normal);
                    border-radius: 10px;
                    margin: 5px;
                    color: var(--interactive-normal);
                    font-size: large;
                    font-weight: bold;
                }

                .switchButton p {
                    margin: 0 0 5px 0;
                }

                .switchButton:hover {
                    color: var(--interactive-hover);
                    fill: var(--interactive-hover);
                    border: 3px solid var(--interactive-hover);
                }

                .cantUpload {
                    color: var(--info-warning-foreground);
                }

                .uploadReady {
                    color: var(--text-normal);
                }

                .uploadPassword {
                    width: 100%;
                    padding: 5px;
                }

                .uploadReady li {
                    display: list-item;
                    list-style-position: inside;
                    list-style-type: circle;
                }

                .uploadHeader {
                    font-weight: bold;
                    margin: 0 0 5px 0;
                }

                .uploadHeaderNotTop {
                    font-weight: bold;
                    margin: 10px 0 5px 0;
                }
            `);
        };

        openSyncModal() {
            /*DiscordModules.ModalActions.openModal(props => {
                return <MenuModal slidesMod={this.slides.Slides}/>
            });*/
            Modals.showModal("SettingsSync Menu", <MenuModal slidesMod={this.slides.Slides}/>, {cancelText: "Cancel", confirmText: null});
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
                new Switch("Sync Meta", "Include BetterDiscord configuration files in synchronziation. This includes which plugins and themes are enabled as well as everything under the Settings, Emotes, Custom CSS and other tabs.", settings.syncMeta, on => { settings.syncMeta = on; }),
                new Switch("Overwrite Data", "Overwrite local data on sync. Always on for files synced under Sync Meta.", settings.overwrite, on => { settings.overwrite = on; })
            ).getElement();
        }
    };

    return SettingsSync;
}