import React from 'react';
import Client from './../MinervaClient';

class ActiveImports extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            filesets: []
        }

        this.loadActiveImports();
    
    }

    componentDidMount(){
        this.interval = setInterval(() => {
            this.loadActiveImports();
        }, 5000)
    }

    componentWillUnmount(){
       clearInterval(this.interval);
    }

    loadActiveImports() {
        Client.listIncompleteImports().then(res => {
            this.setState({ filesets: res.included.filesets });
            console.log(res);
        });
    }

    render() {
        return (
            <div>
                <h4>Fileset import status</h4>
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