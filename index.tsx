module.exports = (Plugin, Library) => {
    "use strict";

    const {Patcher, WebpackModules, Settings, DiscordModules, PluginUtilities} = Library;
    const {SettingPanel, Switch} = Settings;
    const {React} = BdApi;

    const {ModalRoot, ModalHeader, ModalContent, ModalFooter} = BdApi.findModuleByProps("ModalRoot");
    const Button = BdApi.findModuleByProps("BorderColors");
    const ModalActions = BdApi.findModuleByProps("openModal", "useModalsStore");
    const headerBar = WebpackModules.find(mod => mod.default?.displayName === "HeaderBarContainer");
    const clickable = WebpackModules.find(mod => mod.default?.displayName === "Clickable");
    const slides = WebpackModules.find(mod => mod.hasOwnProperty("Slides"));
    const textInput = WebpackModules.find(mod => mod.default?.displayName === "TextInput");

    const buttonLookStyles = BdApi.findModuleByProps("lookLink");
    const justifyStyles = BdApi.findModuleByProps("justifyBetween");
    const colorStyles = BdApi.findModuleByProps("colorPrimary");

    // Used to make sure the correct BD settings folder is selected
    const releaseChannel = DiscordNative.remoteApp.getReleaseChannel();

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
                <SwitchButton title="Import" onClick={() => { props.onClick(0); }}>
                    <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24">
                        <g><rect/></g><g><path d="M5,20h14v-2H5V20z M19,9h-4V3H9v6H5l7,7L19,9z"/></g>
                    </svg>
                </SwitchButton>
                <SwitchButton title="Export" onClick={() => { props.onClick(2); }}>
                    <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24">
                        <g><rect/></g><g><path d="M5,20h14v-2H5V20z M5,10h4v6h6v-6h4l-7-7L5,10z"/></g>
                    </svg>
                </SwitchButton>
            </div>
        );
    }

    function hasAnyCategoryEnabled(): boolean {
        return settings.syncMeta || settings.syncPluginSettings || settings.syncPlugins || settings.syncThemes;
    }

    function EnabledCategories() {
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
            <ul>
                {listItems}
            </ul>
        );
    }

    function ExportMenuUpload(props) {
        return (
            <div className="uploadReady">
                <p className="uploadHeader">Export Manifest:</p>
                <EnabledCategories/>

                <p class="uploadHeaderNotTop">Password (Optional):</p>
                {React.createElement(textInput.default, {maxLength: 999, onChange: val => { props.setPassword(val); }, type: "password", disabled: props.disable})}

                {props.disable && (
                    <p className="topMargin">Uploading ZIP, this may take a few minutes...</p>
                )}

                {props.link !== null && (
                    <div className="topMargin">
                        <h3>Your selected categories have now been uploaded to tmp.ninja. To retrieve your files, open SettingsSync: Import settings on your other client and paste in this link:</h3>
                        <h2 className="clickToHighlight link" onClick={props.handleClick}>
                            <strong>{props.link}</strong>
                        </h2>
                        {props.showCopied &&
                            <p className="copied">Copied!</p>
                        }
                    </div>
                )}

                {props.error !== null && (
                    <p class="topMargin error"><strong>Error:</strong> {props.error}</p>
                )}
            </div>
        );
    }

    function MenuCategoryError(action: string) {
        return (
            <p className="cantUpload">Looks like you don't have any categories selected to {action}! You can change this in the SettingsSync plugin settings.</p>
        )
    }

    function ExportMenu(props) {
        return (
            <div>
                {hasAnyCategoryEnabled() && ExportMenuUpload({
                    disable: props.disable,
                    setPassword: props.setPassword,
                    link: props.link,
                    error: props.error,
                    handleClick: props.handleCopyClick,
                    showCopied: props.copyClicked
                })}
                {!hasAnyCategoryEnabled() && MenuCategoryError("export")}
            </div>
        );
    }

    function ImportMenuMain(props) {
        return (
            <div className="uploadReady">
                <p className="uploadHeader">Import Type:</p>
                {React.createElement(DiscordModules.Dropdown, {
                    onChange: val => { props.onImportTypeChange(val); },
                    options: [
                        {
                            label: "Import from Link",
                            value: "link"
                        },
                        {
                            label: "Import from Local ZIP",
                            value: "local"
                        }
                    ],
                    value: props.importValue
                }, [])}

                {props.importValue === "link" && (<div>
                    <p class="uploadHeaderNotTop">Link:</p>
                    {React.createElement(textInput.default, {maxLength: 999, onChange: val => { props.setImportLink(val); }, disabled: props.disable})}
                </div>)}

                {props.importValue === "local" && (<div>
                    <p class="uploadHeaderNotTop">ZIP File:</p>
                    {React.createElement(Button, {
                        onClick: () => { props.getZIP(); }, 
                        color: colorStyles.colorPrimary,
                        disabled: props.disable
                    }, "Select...")}
                    {props.importPath.length > 0 && (
                        <p><strong>Path:</strong> {props.importPath}</p>
                    )}
                </div>)}

                <p className="cantUpload"><strong>WARNING:</strong> Only import from sources you trust!</p>

                <p class="uploadHeaderNotTop">Password if Encrypted:</p>
                {React.createElement(textInput.default, {maxLength: 999, onChange: val => { props.setPassword(val); }, type: "password", disabled: props.disable})}

                <p className="uploadHeaderNotTop">Import Manifest:</p>
                <EnabledCategories/>

                {settings.overwrite && (
                    <p class="cantUpload"><strong>WARNING:</strong> Overwrite mode enabled, all import categories listed above will be overwritten on import!</p>
                )}

                {props.error !== null && (
                    <p class="topMargin error"><strong>Error:</strong> {props.error}</p>
                )}
            </div>
        );
    }

    function ImportMenu(props) {
        return (
            <div>
                {hasAnyCategoryEnabled() && ImportMenuMain(props)}
                {!hasAnyCategoryEnabled() && MenuCategoryError("import")}
            </div>
        );
    }

    let canCloseModal: boolean = true;

    function urlIsValid(urlString: string): boolean {
        if (!urlString.startsWith("http")) {
            urlString = `https://${urlString}`;
        }

        let url;
  
        try {
            url = new URL(urlString);
        } catch (_) {
            return false;  
        }

        return url.protocol === "https:";
    }

    class MenuModal extends React.Component {
        constructor(props) {
            super(props);
            this.props = props;
            this.state = {
                activeSlide: 1,
                password: "",
                lock: false,
                error: null,
                link: null,
                copyClicked: false,
                importPath: "",
                importValue: "link"
            };

            // Bindings
            this.onMenuChange = this.onMenuChange.bind(this);
            this.setCanClose = this.setCanClose.bind(this);
            this.didSetPassword = this.didSetPassword.bind(this);
            this.didSetLink = this.didSetLink.bind(this);
            this.handleCopyClick = this.handleCopyClick.bind(this);
            this.handleImportTypeChange = this.handleImportTypeChange.bind(this);
            this.getZIP = this.getZIP.bind(this);
        }

        onMenuChange(target: number) {
            this.setState({activeSlide: target});
        }

        setCanClose(can: boolean) {
            canCloseModal = can;
        }

        didSetPassword(password: string) {
            this.setState({"password": password});
        }

        didSetLink(link: string) {
            this.setState({importPath: link, error: null});
        }

        handleCopyClick() {
            require("electron").clipboard.writeText(this.state.link);
            this.setState({copyClicked: true});
        }

        handleImportTypeChange(val: string) {
            if (this.state.lock) {
                return;
            }
            this.setState({importPath: "", importValue: val, error: null});
        }

        getZIP() {
            openZIP().then(path => {
                this.didSetLink(path);
                this.setState({error: null});
            }).catch(err => {
                this.setState({error: err});
            });
        }

        renderMainArea() {
            return (<div className="slides">{React.createElement(slides.Slides, {
                activeSlide: this.state.activeSlide, 
                springConfig: {clamp: true, friction: 20, tension: 210},
                width: 400
            },[
                <div id={0} children={<ImportMenu setPassword={this.didSetPassword} onImportTypeChange={this.handleImportTypeChange} setImportLink={this.didSetLink} getZIP={this.getZIP} importValue={this.state.importValue} importPath={this.state.importPath} error={this.state.error} disable={this.state.lock}/>}/>,
                <div id={1} children={<MainMenu onClick={this.onMenuChange}/>}/>,
                <div id={2} children={<ExportMenu setPassword={this.didSetPassword} disable={this.state.lock} link={this.state.link} error={this.state.error} handleCopyClick={this.handleCopyClick} copyClicked={this.state.copyClicked}/>}/>
            ])}</div>);
        }

        createButton(props: object, name: string) {
            return React.createElement(Button, {...props}, name);
        }

        getPageButtons() {
            const pass = this.state.password.length > 0 ? this.state.password : null;
            return this.state.activeSlide == 0 ? (
                <div>
                    {this.createButton({
                        onClick: () => {
                            this.setState({lock: true});
                            importZIP(this.state.importPath, this.state.importValue === "link", pass).then(() => {
                                this.setState({lock: false});
                                location.reload();
                            }).catch(err => {
                                this.setState({lock: false, error: err});
                            });
                        },
                        disabled: !(urlIsValid(this.state.importPath) || (this.state.importValue == "local" && this.state.importPath.length > 0)) || this.state.lock
                    }, this.state.lock ? React.createElement(DiscordModules.Spinner, {type: DiscordModules.Spinner.Type.PULSING_ELLIPSIS}, []) : "Import & Reload")}
                </div>
            ) : (
                <div className="mainMenu">
                    {this.createButton({
                        className: "buttonPaddingRight",
                        onClick: () => { exportZIP(pass); },
                        disabled: this.state.lock || !hasAnyCategoryEnabled()
                    }, "Export ZIP")}
                    {this.createButton({onClick: () => {
                        this.setCanClose(false);
                        this.setState({lock: true, link: null, error: null});
                        uploadZIP(pass).then(link => {
                            this.setCanClose(true);
                            this.setState({lock: false, link: link});
                        }).catch(err => {
                            this.setCanClose(true);
                            this.setState({lock: false, error: err});
                        })
                    }, disabled: this.state.lock || !hasAnyCategoryEnabled()}, this.state.lock ? React.createElement(DiscordModules.Spinner, {type: DiscordModules.Spinner.Type.PULSING_ELLIPSIS}, []) : "Upload")}
                </div>
            );
        }

        render() {
            const shouldShowButtons = this.state.activeSlide !== 1;
            let title = "SettingsSync";
            if (this.state.activeSlide === 0) {
                title += ": Import";
            } else if (this.state.activeSlide === 2) {
                title += ": Export";
            }

            return React.createElement(ModalRoot, this.props, [
                React.createElement(ModalHeader, {separator: false, className: "modalTitle"}, title),
                React.createElement(ModalContent, null, [
                    this.renderMainArea()
                ]),
                React.createElement(ModalFooter, {justify: shouldShowButtons ? justifyStyles.justifyBetween : justifyStyles.justifyEnd}, [
                    (shouldShowButtons && this.getPageButtons()),
                    this.createButton({
                        onClick: () => { ModalActions.closeModal("SettingsSync"); }, 
                        look: buttonLookStyles.lookLink,  
                        color: colorStyles.colorPrimary,
                        disabled: this.state.lock
                    }, "Close")
                ])
            ])
        }
    }

    function attemptModalClose() {
        if (canCloseModal) {
            ModalActions.closeModal("SettingsSync");
        }
    }

    function SyncIconButton() {
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

    async function openZIP(): Promise<string> {
        const res = await DiscordNative.fileManager.showOpenDialog({
            title: "Import BD Settings...",
            filters: [
                {name: "BD Files", extensions: ["zip"]}
            ],
            properties: [
                "openFile"
            ],
            buttonLabel: "Import"
        })

        if (res.length == 0) {
            return "";
        }
        
        return res[0];
    }

    async function importZIP(pathStr: string, isURL: boolean, password?: string) {
        const fs = require("fs/promises");
        const path = require("path");
        if (isURL) {
            const tempFolder = await fs.mkdtemp(path.join(require("os").tmpdir(), `settingsync-download-${require("crypto").randomBytes(16).toString("hex")}`));
            const dest = path.join(tempFolder, "settingsSync.zip");
            const file = require("fs").createWriteStream(dest);
            await new Promise<void>((resolve, reject) => {
                try {
                    require("https").get(pathStr, response => {
                        response.pipe(file);
                        file.on("finish", () => {
                            file.close();
                            resolve();
                        });
                    }).on("error", err => {
                        fs.unlink(dest);
                        reject(err);
                    });
                } catch (e) {
                    reject(e.message);
                }
            });

            pathStr = dest;
        }

        const Minizip = require('minizip-asm.js');
        let zipFile = new Minizip(await require("fs/promises").readFile(pathStr));

        const zipContents = zipFile.list();
        const zipIsEncrypted = zipContents.some(file => file.crypt);
        if (password == null && zipIsEncrypted) { // TODO: Check that password is correct
            throw "No password supplied for encrypted ZIP file";
        }

        // Only import stuff that was selected in settings
        const toImport = zipContents.filter(element => {
            const path = element.filepath;
            if (settings.syncMeta && path.match(`^${releaseChannel}`)) {
                return true;
            }

            if (settings.syncPluginSettings && path.match(/^plugins\/.*\.config\.json$/)) {
                return true;
            }

            if (settings.syncPlugins && path.match(/^plugins\/.*\.plugin\.js$/)) {
                return true;
            }

            if (settings.syncThemes && path.match(/^themes/)) {
                return true;
            }

            return false;
        }).map(element => element.filepath);

        for (const targetPath of toImport) {
            let fileContents = null;
            try {
                fileContents = zipFile.extract(targetPath, zipIsEncrypted ? {"password": password} : {});
            } catch (_) {
                throw "Incorrect password for encrypted ZIP file";
            }
            
            try {
                await fs.writeFile(path.join(BdApi.Plugins.folder, "..", targetPath.startsWith(releaseChannel) ? path.join("data", targetPath) : targetPath), fileContents, {
                    // Overwrite if overwrite setting enabled or syncing BD config file
                    flag: settings.overwrite || targetPath.startsWith(releaseChannel) ? "w" : "wx"
                });
            } catch (e) {
                if (e.code !== "EEXIST") {
                    throw e;
                }
            }
        }
    }

    async function exportZIP(password?: string) {
        const bytes = await compressBD(password);
        DiscordNative.fileManager.saveWithDialog(bytes, "settingsSync.zip");
    }

    async function uploadZIP(password?: string): Promise<string> {
        const bytes = await compressBD(password);
        const hash = require("crypto").createHash("sha1").update(bytes).digest("hex");

        // Upload file to tmp.ninja and get response
        const FormData = require("form-data");
        const form = new FormData();
        form.append("files[]", Buffer.from(bytes), "settingsSync.zip");

        const options = {
            hostname: "tmp.ninja",
            port: 443,
            path: "/upload.php",
            method: "POST",
            headers: form.getHeaders()
        };

        return new Promise((resolve, reject) => {
            let data: string = "";
            const req = require("https").request(options, res => {
                res.setEncoding("utf-8");
                res.on("data", chunk => {
                    data += chunk;
                })
                res.on("end", () => {
                    const json = JSON.parse(data);
                    if (!json.success) {
                        reject(`${json.errorcode}: ${json.description}`);
                        return;
                    }
                    if (hash !== json.files[0].hash) {
                        reject(`Hash Mismatch: Original: ${hash} Uploaded: ${json.files[0].hash}`);
                    }
                    resolve(json.files[0].url);
                })
            }).on("err", err => {
                reject(err);
            });

            req.write(form.getBuffer());
            req.end();
        });
    }

    // Returns compressed file bytes
    async function compressBD(password?: string): Promise<Uint8Array> {
        const Minizip = require('minizip-asm.js');
        const glob = require("glob");
        const path = require("path");
        const fs = require("fs/promises");

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
            zipFile.append(`plugins/${path.basename(pathStr)}`, await fs.readFile(pathStr), options);
        }

        if (settings.syncThemes) {
            const paths = glob.sync(path.join(BdApi.Themes.folder, "*.theme.css"));
            for (const pathStr of paths) {
                zipFile.append(`themes/${path.basename(pathStr)}`, await fs.readFile(pathStr), options);
            }
        }

        if (settings.syncMeta) {
            const paths = glob.sync(path.join(BdApi.Plugins.folder, `../data/${releaseChannel}`, "*.*"));
            for (const pathStr of paths) {
                zipFile.append(`${releaseChannel}/${path.basename(pathStr)}`, await fs.readFile(pathStr), options);
            }
        }

        return zipFile.zip();
    }

    class SettingsSync extends Plugin {
        onStart() {
            reloadSettings();

            Patcher.after(headerBar.default.prototype, "renderLoggedIn", (_, [arg], ret) => {
                ret.props.toolbar.props.children.push(React.createElement(DiscordModules.Tooltip, {text: "SettingsSync", position: "left"}, [
                    React.createElement(clickable.default, {
                        "aria-label": "SettingsSync", 
                        className: "iconWrapper clickable",
                        onClick: this.openSyncModal.bind(this),
                        role: "button"
                    }, [<SyncIconButton/>])
                ]));
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

                .slides {
                    padding-bottom: 16px;
                }

                .buttonPaddingRight {
                    margin-right: 8px;
                }

                .modalTitle {
                    color: var(--text-normal);
                    font-size: x-large;
                    font-weight: bold;
                }

                .error {
                    color: var(--info-danger-foreground);
                }

                .topMargin {
                    margin: 10px 0 5px 0;
                }
            `);
        };

        openSyncModal() {
            /*DiscordModules.ModalActions.openModal(props => {
                return <MenuModal slidesMod={this.slides.Slides}/>
            });*/
            ModalActions.openModal(props => <MenuModal {...props}/>, {onCloseRequest: attemptModalClose, modalKey: "SettingsSync"})
            // Modals.showModal("SettingsSync Menu", <MenuModal/>, {cancelText: "Cancel", confirmText: null});
        }

        onStop() {
            Patcher.unpatchAll();
            BdApi.clearCSS("SettingsSync");
        };

        getSettingsPanel() {
            reloadSettings();

            return new SettingPanel(() => { PluginUtilities.saveSettings("SettingsSync", settings); },
                new Switch("Sync Plugins", "Include plugins in import/export.", settings.syncPlugins, on => { settings.syncPlugins = on; }),
                new Switch("Sync Plugins Settings", "Include plugin settings in import/export.", settings.syncPluginSettings, on => { settings.syncPluginSettings = on; }),
                new Switch("Sync Themes", "Include themes in import/export.", settings.syncThemes, on => { settings.syncThemes = on; }),
                new Switch("Sync Meta", "Include BetterDiscord configuration files in import/export. This includes which plugins and themes are enabled as well as everything under the Settings, Emotes, Custom CSS and other tabs.", settings.syncMeta, on => { settings.syncMeta = on; }),
                new Switch("Overwrite Data", "Overwrite local data on sync. Files synced under Sync Meta are always overwritten if they are enabled.", settings.overwrite, on => { settings.overwrite = on; })
            ).getElement();
        }
    };

    return SettingsSync;
}