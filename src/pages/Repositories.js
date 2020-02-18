import React from 'react';
import Client from './../MinervaClient';
import RepositoryTree from './../components/RepositoryTree';
import '../css/Repository.css';

class Repositories extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            repositories: [],
            nodes: [],
            selected: null,
            imageSrc: null,
            imageDetails: null
        };
        this.refreshRepositories();

        this.select = this.select.bind(this);
    }

    select(node) {
        this.setState({ selected: node });
        let image = node.data;
        let pyramidTopLevel = image.pyramid_levels - 1;
        Client.getImageTile(node.uuid, pyramidTopLevel, 0, 0).then(response => {
            console.log(response);
            var objectURL = URL.createObjectURL(response);
            this.setState({ imageSrc: objectURL });
        });
        Client.getImageDimensions(node.uuid).then(response => {
            console.log(response);
            this.setState({imageDetails: response.data});
        });
    }

    refreshRepositories() {
        if (!Client.loggedIn()) {
            return;
        }
        Client.getRepositories().then(repos => {
            console.log(repos);
            let repositories = [];
            for (let repo of repos.included.repositories) {
                repositories.push({
                    type: 'repository',
                    uuid: repo.uuid,
                    key: repo.uuid,
                    title: repo.name,
                    isLeaf: false,
                    description: 'Repository',
                    level: 1,
                    expanded: false,
                    color: 'primary'
                });
            }
            this.setState({ nodes: repositories });
        });
    }

    render() {
        return (
            <div className="row">
                <div className="col-3 bg-light navigator">
                    <h2 className="h4">EXPLORE</h2>
                    <RepositoryTree onSelect={this.select} />
                </div>
                <div className="col overflow-hidden bg-white">
                    {this.renderImageThumbnail()}
                </div>
                <div className="col-3 bg-light border">
                    {this.renderImageDetails()}
                </div>
            </div>

        );
    }

    renderImageDetails() {
        if (!this.state.imageDetails) {
            return null;
        }
        let pixels = this.state.imageDetails.pixels;
        return (
            <table className="imageDetails" cellPadding="5">
                <tbody>
                <tr><td>Uuid:</td><td>{this.state.imageDetails.image_uuid}</td></tr>
                <tr><td>Channels:</td><td>{pixels.SizeC}</td></tr>
                <tr><td>Width:</td><td>{pixels.SizeX}</td></tr>
                <tr><td>Height:</td><td>{pixels.SizeY}</td></tr>
                <tr><td>Z-Levels:</td><td>{pixels.SizeZ}</td></tr>
                </tbody>
            </table>
        );
    }

    renderImageThumbnail() {
        if (!this.state.selected || !this.state.selected.data) {
            return null;
        }
        return (
            <div className="thumbnailContainer">
                <img className="thumbnailImg" src={this.state.imageSrc} />
                <h5 className="card-title">{this.state.selected ? this.state.selected.data.name : null}</h5>
            </div>
        );
    }
}

export default Repositories;