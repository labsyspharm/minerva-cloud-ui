import React from 'react';
import AWS from 'aws-sdk';
import Client from '../MinervaClient';
import ActiveImports from './../components/ActiveImports';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMicroscope } from '@fortawesome/free-solid-svg-icons'
import RepositorySelect from '../components/RepositorySelect';
import '../css/ImportTool.css';
import NotLoggedIn from '../components/NotLoggedIn';

const STATUS_INITIAL = 0;
const STATUS_UPLOADING = 1;
const STATUS_SYNCING = 2;
const STATUS_EXTRACTING = 3;
const STATUS_FINISHED = 4;

class ImportTool extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            selectedFile: null,
            progress: 0,
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
            if (err.status == 403) {
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
                });
        });
        // TODO upload image to S3 ...
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
            console.log('Uploading image to S3...');

            s3.upload({ Bucket: bucket, Key: key, Body: file.file })
                .on('httpUploadProgress', (progress) => {
                    let percentage = Math.floor(progress.loaded / progress.total * 100);
                    if (percentage > prevPercentage) {
                        prevPercentage = percentage;
                        this.setState({ progress: percentage });
                    }
                })
                .send(function (err, data) {
                    console.log(err, data);
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
            return (
                <NotLoggedIn/>
            );
        }
        return (
            <div className="container">
                {this.renderHelp()}

                <div className="row mb-3 mt-3">
                <div className="col-6 form-group container">
                    <div className="row">
                        <div className="col">
                            <div className="card bg-dark">
                                <div className="card-body">
                                <h5 class="card-title">Create new Repository</h5>
                                <input type="text" className="" id="repositoryName" name="newRepositoryName" ref={this.newRepositoryName} placeholder="Enter repository name" />&nbsp;
                                <button type="button" className="btn btn-success" onClick={this.createRepository}>Create</button>
                                <br/>
                                <input type="checkbox" className="htmlForm-check-input" id="archive" name="archive" />
                                <label className="form-check-label" htmlFor="exampleCheck1">Archive raw images</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row mb-3">
                        <div className="col">
                            <div className="mt-3">
                            <RepositorySelect ref={this.selectRepositoryRef} onSelect={this.repositorySelected} />
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col custom-file">
                            <input className="custom-file-input" type="file" id="inputGroupFile01" onChange={this.onFileSelected} />
                            <label className="custom-file-label" htmlFor="inputGroupFile01">Select file</label>
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



    repositorySelected(repository) {
        console.log('Selecting repository ', repository);
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

        if (this.state.status === STATUS_UPLOADING) {
            uploadStatusText = this.state.progress + '%';
            uploadStatusText = 'Uploading file ' + uploadStatusText;
            syncingStatusText = 'Don\'t close browser!';
        }
        if (this.state.status === STATUS_SYNCING) {
            uploadStatusText = 'Uploading finished';
            syncingStatusText = 'Syncing EFS...';
        }
        if (this.state.status === STATUS_EXTRACTING) {
            extractingStatusText = this.state.extractProgress + '%';
            extractingStatusText = 'BioFormats extraction ' + extractingStatusText;
            uploadStatusText = 'Uploading finished';
            syncingStatusText = 'Syncing finished';
        }
        if (this.state.status === STATUS_FINISHED) {
            uploadStatusText = 'Uploading finished';
            syncingStatusText = 'Syncing finished';
            extractingStatusText = 'Extracting finished';
            finishedStatusText = 'Import finished!';
        }
        let omeTif = this.state.selectedFile.name.indexOf('.ome.tif') !== -1;
        let rareCyte = this.state.selectedFile.name.indexOf('.rcpnl') !== -1;
        return (
            <div className="card bg-dark">
                <div className="card-body">
                    <h5 className="card-title">{this.state.selectedFile.name}</h5>
                    <p>
                    { rareCyte ? <FontAwesomeIcon icon={faMicroscope}/> : null}
                    { omeTif ? <img className="fileIcon" src="ome.svg"/> : null}
                    </p>
                    <p>{this.state.selectedFile.sizeReadable}</p>
                    <p><strong>{uploadStatusText}</strong></p>
                    <p><strong>{syncingStatusText}</strong></p>
                    <p><strong>{extractingStatusText}</strong></p>
                    <p><strong>{finishedStatusText}</strong></p>
                </div>
                { this.state.status === STATUS_INITIAL ? 
                    <button type="button" className="btn btn-primary" disabled={this.state.status === STATUS_UPLOADING} onClick={this.startImport}>Start import</button>
                    :
                    <span className="btn btn-success">Processing import...</span>
                }

            </div>
        );
    }

    renderHelp() {
        return (
            <div className="importHelpBox text-left">
            <dl>
                <dt>Create new repository</dt>
                <dd>Alternatively use a pre-existing one</dd>
                <dt>Select Repository</dt>
                <dd>Image will be imported to this repository</dd>
                <dt>Select image</dt>
                <dd>Supported files are BioFormats-compatible formats such as .ome.tif or .rcpnl</dd>
                <dt>Click Start Import</dt>
                <dd>Don't close browser while uploading file. It's safe to close the browser after the upload has completed.</dd>
            </dl>
        </div>
        );
    }
}

export default ImportTool;