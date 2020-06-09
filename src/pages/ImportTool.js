import React from 'react';
import AWS from 'aws-sdk';
import Client from '../MinervaClient';
import ActiveImports from './../components/ActiveImports';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMicroscope, faPlus, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import RepositorySelect from '../components/RepositorySelect';
import '../css/ImportTool.css';
import ImportHelpModal from '../components/ImportHelpModal';

const STATUS_INITIAL = 0;
const STATUS_UPLOADING = 1;
const STATUS_SYNCING = 2;
const STATUS_EXTRACTING = 3;
const STATUS_FINISHED = 4;
const STATUS_ERROR = 99;

class ImportTool extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            selectedFile: null,
            progress: 0,
            uploadSpeed: 0,
            uploadEta: 0,
            extractProgress: 0,
            uploading: false,
            extracting: false,
            status: 0,
            repositories: [],
            repository: {},
            newRepositoryName: ''
        }
        this.newRepositoryName = React.createRef();
        this.selectRepositoryRef = React.createRef();

        this.onFileSelected = this.onFileSelected.bind(this);
        this.startImport = this.startImport.bind(this);
        this.createRepository = this.createRepository.bind(this);
        this.repositorySelected = this.repositorySelected.bind(this);

        this.loadRepositories();
    }

    loadRepositories() {
        Client.getRepositories().then(res => {
            let repositories = [];
            repositories = repositories.concat(res.included.repositories);
            this.setState({ repositories: repositories });
        });
    }

    createRepository() {
        if (!this.newRepositoryName.current || !this.newRepositoryName.current.value) {
            alertify.warning('Repository name is missing');
            return;
        }
        let raw_storage = "Destroy";
        if (this.state.archive) {
            raw_storage = "Archive";
        }
        Client.createRepository({
            'name': this.newRepositoryName.current.value,
            'raw_storage': raw_storage
        }).then(response => {
            console.log(response);
            alertify.success("Repository " + this.newRepositoryName.current.value + " created.", 2);
            this.selectRepositoryRef.current.refresh();
        }).catch(err => {
            alertify.error('Error in creating new Repository. Check that repository name does not already exist.');
        });
    }

    handleChange = evt => {
        const value =
            evt.target.type === "checkbox" ? evt.target.checked : evt.target.value;
        this.setState({
            ...this.state,
            [evt.target.name]: value
        });
    }

    onFileSelected(evt) {
        let file = evt.target.files[0];
        if (!file) {
            return;
        }
        console.log(file);
        let sizeReadable = file.size + ' bytes';
        if (file.size > 1000) {
            sizeReadable = Math.round(file.size / 1000) + ' KB';
        }
        if (file.size > 1000000) {
            sizeReadable = Math.round(file.size / 1000000) + ' MB';
        }
        let selectedFile = {
            file: file,
            name: file.name,
            sizeBytes: file.size,
            sizeReadable: sizeReadable
        }
        this.setState({ selectedFile: selectedFile, status: STATUS_INITIAL });
    }

    startImport() {
        console.log('Starting import');
        if (!this.state.repository.uuid) {
            alertify.warning('Select a repository first');
            return;
        }
        let importDate = new Date().toISOString();
        // Minerva does not accept : or . in a repository name, so we need to change them to - and _
        importDate = importDate.replace(/:/g, '-');
        importDate = importDate.replace(/\./g, '_');

        let import_ = Client.createImport({
            'name': 'Import' + importDate,
            'repository_uuid': this.state.repository.uuid
        })
        .then((response) => {
            console.log(response);
            alertify.success("Import created", 2);
            return response;
        })
        .catch((err) => {
            console.error(err);
            if (err.status === 403) {
                alertify.error('You don\'t have write permission to selected repository.');
            } else {
                alertify.error(err.message);
            }
            throw err;
        });

        let importUuid = null;
        // Get the import credentials
        const importCredentials = import_
            .then(response => {
                importUuid = response['data']['uuid'];
                return Client.getImportCredentials(response['data']['uuid']);
            })
            .then(res => {
                console.log(res);
                return res;
            })
            .catch(err => {
                console.error(err);
                throw err;
            });

        importCredentials.then(response => {
            const credentials = new AWS.Credentials(
                response['data']['credentials']['AccessKeyId'],
                response['data']['credentials']['SecretAccessKey'],
                response['data']['credentials']['SessionToken']
            );
            const url = response['data']['url'];
            this.setState({ status: STATUS_UPLOADING });
            this.uploadS3(this.state.selectedFile, url, credentials)
                .then(() => {
                    this.setState({ status: STATUS_SYNCING });
                    this.setImportComplete(importUuid);
                    this.pollImportFilesets(importUuid);
                }).catch(err => {
                    this.setState({ status: STATUS_ERROR });
                });
        });
    }

    uploadS3(file, url, awsCredentials) {
        // Use the temporary credentials to upload a file
        const r = /^s3:\/\/([A-z0-9-]+)\/([A-z0-9-]+\/)$/;
        const m = r.exec(url);
        const bucket = m[1];
        const prefix = m[2];

        return new Promise((resolve, reject) => {
            let key = prefix + '/' + file.name;

            let s3 = new AWS.S3({
                region: "us-east-1",
                credentials: awsCredentials
            });
            let prevPercentage = 0;
            const start = performance.now();
            console.log('Uploading image to S3...');

            s3.upload({ Bucket: bucket, Key: key, Body: file.file })
                .on('httpUploadProgress', (progress) => {
                    let percentage = Math.floor(progress.loaded / progress.total * 100);
                    let elapsed = performance.now() - start;
                    let speed = (progress.loaded / 1000) / elapsed;
                    if (!speed) {
                        speed = 0;
                    }
                    this.setState({ uploadSpeed: speed });

                    if (percentage > prevPercentage) {
                        prevPercentage = percentage;
                        let secondsLeft = null;
                        if (speed > 0) {
                            let bytesLeft = progress.total - progress.loaded;
                            secondsLeft = (bytesLeft / 1000000) / speed;
                        }
                        this.setState({ progress: percentage,
                            uploadEta: secondsLeft });
                    }
                })
                .send(function (err, data) {
                    if (err) {
                        console.error(err);
                        reject(err);
                    }
                    resolve(data);
                });
        });
    }

    setImportComplete(importUuid) {
        return Client.updateImport(importUuid, { 'complete': true });
    }

    pollImportFilesets(importUuid) {
        if (this.state.status === STATUS_SYNCING || this.state.status === STATUS_EXTRACTING) {
            setTimeout(() => {
                this.getFilesetsInImport(importUuid).then(() => {
                    this.pollImportFilesets(importUuid);
                });
            }, 3000);
        }
    }

    getFilesetsInImport(importUuid) {
        return Client.listFilesetsInImport(importUuid).then(response => {
            let filesets = response.data;
            if (filesets.length > 0) {
                // TODO fix in case there's multiple filesets in one import
                if (this.state.status === STATUS_SYNCING) {
                    this.setState({ status: STATUS_EXTRACTING });
                }
                let progress = filesets[0].progress;
                if (!progress) {
                    progress = 0;
                }
                this.setState({ extractProgress: progress });

                if (filesets[0].complete) {
                    this.setState({ status: STATUS_FINISHED });
                }
            }
            return response;
        });
    }

    render() {
        if (!this.props.loggedIn) {
            return null;
        }
        return (
            <div className="container">
                <ImportHelpModal modalId="renderHelpModal"/>
                <div className="row mb-3 mt-3">
                <div className="col-6 form-group container">
                    {this.renderNewRepositoryModal()}

                    <div className="row mb-3 mt-3">
                        <div className="col">
                        <button type="button" className="btn btn-outline-light" data-toggle="modal" data-target="#renderHelpModal">
                                <FontAwesomeIcon className="mr-3" icon={faInfoCircle} size="lg" />
                                Instructions
                        </button>
                        </div>
                        <div className="col">
                            <RepositorySelect ref={this.selectRepositoryRef} onSelect={this.repositorySelected} />
                        </div>
                        <div className="col">
                            <button type="button" className="btn btn-success" data-toggle="modal" data-target="#addRepositoryModal">
                                <FontAwesomeIcon className="mr-3" icon={faPlus} />
                                Create New
                            </button>
                        </div>
                    </div>
                    <div className="row justify-content-center">
                        <div className="col-6 custom-file justify-content-start">
                            <input className="custom-file-input" type="file" id="inputGroupFile01" onChange={this.onFileSelected} />
                            <label className="custom-file-label text-left" htmlFor="inputGroupFile01">Select image</label>
                        </div>
                    </div>

                    <div className="row mt-5">

                        <div className="col">
                            {this.renderSelectedFile()}
                        </div>
                    </div>
                </div>
                <div className="col-3 border-left">
                    <ActiveImports/>
                </div>
                </div>
            </div>
        );
    }

    renderNewRepositoryModal() {
        return (
            <div id="addRepositoryModal" className="modal" tabIndex="-1" role="dialog" aria-labelledby="addRepositoryModal" aria-hidden="true">
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                <div className="modal-header">
                    <h5 className="modal-title text-dark">Create New Repository</h5>
                    <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div className="modal-body text-dark">
                    <div>
                                <div className="card-body">
                                <p className="h6 card-title">You will have Admin permissions for the new repository.</p>
                                <p className="h6">Other users won't have access to the repository, unless explicitly granted.</p>
                                <p className="mt-3">
                                <input type="text" className="" id="repositoryName" name="newRepositoryName" ref={this.newRepositoryName} placeholder="Enter repository name" />&nbsp;
                                </p>
                                <p>
                                    <input type="checkbox" className="htmlForm-check-input" id="archive" name="archive" />
                                    <label className="form-check-label" htmlFor="exampleCheck1">Archive raw images</label>
                                </p>    

                                </div>
                        </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-primary" onClick={this.createRepository} data-dismiss="modal">Create</button>
                    <button type="button" className="btn btn-secondary" data-dismiss="modal">Cancel</button>
                </div>
                </div>
            </div>
            </div>
        );
    }

    repositorySelected(repository) {
        this.setState({ repository: repository });
    }

    renderSelectedFile() {
        if (!this.state.selectedFile) {
            return null;
        }
        let uploadStatusText = null;
        let syncingStatusText = null;
        let extractingStatusText = null;
        let finishedStatusText = null;
        let fileWarning = null;
        let buttonText = "Start import";
        let buttonClass = "btn ";

        if (this.state.status === STATUS_INITIAL) {
            buttonClass += "btn-primary"
        }
        if (this.state.status === STATUS_UPLOADING) {
            let uploadEtaText = "Time left: ";
            if (this.state.uploadEta > 3600) {
                let hours = Math.floor(this.state.uploadEta / 3600);
                let minutes = this.state.uploadEta - (3600 * hours);
                uploadEtaText += hours + "h " + minutes + "min"
            } else if (this.state.uploadEta > 60) {
                let minutes = Math.floor(this.state.uploadEta / 60);
                let seconds = Math.floor(this.state.uploadEta) - (60 * minutes);
                uploadEtaText += minutes + "min " + seconds + "s"
            } else if (this.state.uploadEta > 0) {
                uploadEtaText += Math.floor(this.state.uploadEta) + "s"
            }
            
            let uploadSpeedText = this.state.uploadSpeed.toFixed(2) + ' MB/s'
            uploadStatusText =  "Speed: " + uploadSpeedText + ' - ' + uploadEtaText;
            syncingStatusText = 'Don\'t close the browser!';
            buttonText = "Uploading image...";
            buttonClass += "btn-info";
        }
        if (this.state.status === STATUS_SYNCING) {
            uploadStatusText = 'Uploading finished';
            syncingStatusText = 'Processing upload...';
            buttonText = "Processing import...";
            buttonClass += "btn-info";
        }
        if (this.state.status === STATUS_EXTRACTING) {
            extractingStatusText = this.state.extractProgress + '%';
            extractingStatusText = 'BioFormats extraction ' + extractingStatusText;
            uploadStatusText = 'Uploading finished';
            syncingStatusText = 'Syncing finished';
            buttonText = "Processing import...";
            buttonClass += "btn-info";
        }
        if (this.state.status === STATUS_FINISHED) {
            uploadStatusText = 'Uploading finished';
            syncingStatusText = 'Syncing finished';
            extractingStatusText = 'Extracting finished';
            finishedStatusText = 'Import finished!';
            buttonText = "SUCCESS";
            buttonClass += "btn-success";
        }
        if (this.state.status == STATUS_ERROR) {
            uploadStatusText = 'Error uploading';
            buttonText = "ERROR";
            buttonClass += "btn-error";
        }
        let omeTif = this.state.selectedFile.name.indexOf('.ome.tif') !== -1;
        let rareCyte = this.state.selectedFile.name.indexOf('.rcpnl') !== -1;
        if (!omeTif && !rareCyte) {
            fileWarning = '*Warning* File-format may not be supported';
        }
        return (
            <div className="card bg-dark">
                <div className="card-body">
                    <h5 className="card-title">{this.state.selectedFile.name} ({this.state.selectedFile.sizeReadable})</h5>
                    <p>
                    { rareCyte ? <FontAwesomeIcon icon={faMicroscope}/> : null}
                    { omeTif ? <img className="fileIcon" src="ome.svg" alt="File Icon" /> : null}
                    </p>
                    <p><strong>{fileWarning}</strong></p>
                    <p><strong>{uploadStatusText}</strong></p>
                    { this.state.status !== STATUS_INITIAL ? 
                        <p>
                            <progress max="100" value={this.state.progress}></progress>
                        </p>
                        : null }
                    <p><strong>{syncingStatusText}</strong></p>
                    <p><strong>{extractingStatusText}</strong></p>
                    <p><strong>{finishedStatusText}</strong></p>
                </div>
                { this.state.status === STATUS_INITIAL ? 
                    <button type="button" className={buttonClass} disabled={this.state.status !== STATUS_INITIAL} onClick={this.startImport}>{buttonText}</button>
                    :
                    <span className={buttonClass}>{buttonText}</span>
                }

            </div>
        );
    }
}

export default ImportTool;