import React from 'react';
import Client from './../MinervaClient';
import RepositoryTree from './../components/RepositoryTree';
import ImagePreview from './../components/ImagePreview';
import '../css/Repository.css';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import ImageMetadata from '../components/ImageMetadata';

class Repositories extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            repositories: [],
            nodes: [],
            selected: null,
            imageSrc: null,
            imageDetails: null,
            previewSpinner: false
        };

        this.select = this.select.bind(this);
    }

    select(node) {
        this.setState({ selected: node });
        let image = node.data;
        let pyramidTopLevel = image.pyramid_levels - 1;
        this.setState({previewSpinner: true});
        Client.getImage(node.uuid).then(response => {
            console.log(response);
            if (response.included && response.included.rendering_settings && response.included.rendering_settings.length > 0) {
                let settings = response.included.rendering_settings[0];
                Client.getPrerenderedImageTile(node.uuid, pyramidTopLevel, 0, 0, settings.uuid).then(response => {
                    console.log(response);
                    var objectURL = URL.createObjectURL(response);
                    this.setState({ imageSrc: objectURL, previewSpinner: false });
                }).catch(err => {
                    alertify.error(err);
                    this.setState({ imageSrc: null, previewSpinner: false });
                });
            } else {
                Client.getImageTile(node.uuid, pyramidTopLevel, 0, 0).then(response => {
                    console.log(response);
                    var objectURL = URL.createObjectURL(response);
                    this.setState({ imageSrc: objectURL, previewSpinner: false });
                }).catch(err => {
                    console.error(err);
                    alertify.error(err);
                    this.setState({ imageSrc: null, previewSpinner: false }); 
                });
            }


        });

        Client.getImageDimensions(node.uuid).then(response => {
            console.log(response);
            this.setState({imageDetails: response.data});
        }).catch(err => {
            console.error(err);
            alertify.error('Error in loading image metadata');
            this.setState({imageDetails: null});
        });
    }

    render() {
        if (!this.props.loggedIn) {
            return null;
        }
        let imageTitle = this.state.selected ? this.state.selected.data.name : '';
        return (
            <div className="row">
                <div className="col-3 navigator">
                    <h2 className="h4">EXPLORE</h2>
                    <RepositoryTree onSelect={this.select} refresh={this.props.refresh}/>
                </div>
                <div className="col overflow-hidden">
                    {this.renderSpinner()}
                    <ImagePreview imageSrc={this.state.imageSrc} title={imageTitle} spinner={this.state.previewSpinner}/>
                </div>
                <div className="col-3 metadata">
                    <h2 className="h4">METADATA</h2>
                    <ImageMetadata metadata={this.state.imageDetails}/>
                </div>
            </div>

        );
    }

    renderSpinner() {
        if (!this.state.previewSpinner) {
            return null;
        }
        return (
            <div className="thumbnailSpinner">
                <div className="spinner-border bg-dark" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        );
    }

}

export default Repositories;