import React from 'react';
import Client from './../MinervaClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSync } from '@fortawesome/free-solid-svg-icons'

class ActiveImports extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            filesets: []
        }

        this.loadActiveImports = this.loadActiveImports.bind(this);
        this.startPolling = this.startPolling.bind(this);
    }

    componentDidMount(){
        this.startPolling();
    }

    componentWillUnmount(){
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    startPolling() {
        this.loadActiveImports();
        this.interval = setInterval(() => {
            this.loadActiveImports();
        }, 3000)
    }

    loadActiveImports() {
        Client.listIncompleteImports().then(res => {
            this.setState({ filesets: res.included.filesets });
            if (!res.included.filesets || res.included.filesets.length === 0) {
                clearInterval(this.interval);
            }
        });
    }

    render() {
        return (
            <div>
                <span className="h5">Fileset import status
                    <button className="btn btn-secondary ml-2" onClick={this.startPolling}><FontAwesomeIcon icon={faSync} /></button>
                </span>
                {this.renderImports()}
            </div>
        );
    }

    renderImports() {
        let filesets = this.state.filesets.map((fileset) =>
            <li className="list-group-item bg-dark" key={fileset.uuid}>{fileset.name} {fileset.progress}% <progress id="file" max="100" value={fileset.progress}></progress></li>
        );
        return (
            <ul className="list-group">
                {filesets}
            </ul>
        );
    }
}

export default ActiveImports;