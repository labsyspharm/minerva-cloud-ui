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

        this.onFileSelected = this.onFileSelected.bind(this);
        this.startImport = this.startImport.bind(this);
        this.createRepository = this.createRepository.bind(this);

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
            alertify.success("Repository " + this.newRepositoryName.current.value + " created", 2);
            let repositories = this.state.repositories.concat([response['data']]);
            this.setState({ repositories: repositories });
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
        if (!this.state.selectedFile || !this.state.repository.uuid) {
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
                this.setState({ extractProgress: progress });

                if (filesets[0].complete) {
                    this.setState({ status: STATUS_FINISHED });
                }
            }
            return response;
        });
    }

    render() {
        let repositoryText = 'Click to select';
        if (this.state.repository.name) {
            repositoryText = this.state.repository.name;
        }
        return (
            <div className="container">
                <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 className="h2">Import images</h1>
                </div>
                <div className="row">
                <div className="col-9">
                <div className="form-group">
                    <input type="text" className="" id="repositoryName" name="newRepositoryName" ref={this.newRepositoryName} placeholder="Enter repository name" />&nbsp;
                    <button type="button" className="btn btn-secondary" onClick={this.createRepository} >Create new</button>
                </div>

                <div className="row">
                    <div className="col">
                    <div className="dropdown">
                        <label htmlFor="repositoryDropdown">Select repository:</label>
                        <button className="form-control btn btn-secondary dropdown-toggle" type="button" id="repositoryDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            {repositoryText}
                        </button>
                        {this.renderRepositoryChoices()}
                    </div>
                    </div>
                    <div className="col custom-file">
                        <input className="custom-file-input" type="file" id="inputGroupFile01" onChange={this.onFileSelected} />
                        <label className="custom-file-label" htmlFor="inputGroupFile01">Choose file</label>
                    </div>
                    <div className="col">
                        <input type="checkbox" className="htmlForm-check-input" id="archive" name="archive" />
                        <label className="form-check-label" htmlFor="exampleCheck1">Archive image</label>
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

    renderRepositoryChoices() {
        let choices = this.state.repositories.map((item, index) =>
            <a className="dropdown-item" onClick={() => this.repositorySelected(item)} key={index}>{item.name}</a>
        );
        return (
            <div className="dropdown-menu" aria-labelledby="repositoryDropdown">
                {choices}
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
        return (
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">{this.state.selectedFile.name}&nbsp;<FontAwesomeIcon icon={faMicroscope} /></h5>
                    <p>{this.state.selectedFile.sizeReadable}</p>
                    <p><strong>{uploadStatusText}</strong></p>
                    <p><strong>{syncingStatusText}</strong></p>
                    <p><strong>{extractingStatusText}</strong></p>
                    <p><strong>{finishedStatusText}</strong></p>
                </div>
                <button type="button" className="btn btn-primary" disabled={this.state.uploading} onClick={this.startImport}>Start import</button>

            </div>
        );
    }
}

export default ImportTool;