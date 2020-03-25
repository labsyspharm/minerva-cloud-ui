import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy } from '@fortawesome/free-solid-svg-icons'
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';

class ImageMetadata extends React.Component {

    constructor(props) {
        super(props);

        this.copyUuidToClipboard = this.copyUuidToClipboard.bind(this);
    }
    
    render() {
        console.log(this.props.metadata);
        if (!this.props.image) {
            return null;
        }
        let pixels = {};
        let channels = [];
        let pyramid = '';
        let dimensions = '';
        if (this.props.metadata) {
            pixels = this.props.metadata.pixels;
            pyramid = this.props.metadata.image.pyramid_levels;
            channels = this.props.metadata.pixels.channels.map(c => c.Name).join(', ');
            dimensions = pixels.SizeX + ' x ' + pixels.SizeY + ' x ' + pixels.SizeZ;
        }
        return (
            <table className="imageDetails" cellPadding="5">
                <tbody>
                <tr><td className="align-top">Name:</td><td>{this.props.image.title}</td></tr>
                <tr><td className="align-top">Uuid:</td><td><span id="imageMetadataUuid">{this.props.image.uuid}</span>&nbsp;<button onClick={this.copyUuidToClipboard}><FontAwesomeIcon icon={faCopy} /></button></td></tr>
                <tr><td className="align-top">Dimensions:</td><td>{dimensions} </td></tr>
                <tr><td className="align-top">Pyramid:</td><td>{pyramid}</td></tr>
                <tr><td className="align-top">Channels:</td><td>
                {channels}
                </td></tr>
                </tbody>
            </table>
        );
    }
    
    copyUuidToClipboard() {
        // navigator.clipboard is undefined, if page is served with http (unsecure context)
        if (navigator.clipboard) {
            navigator.clipboard.writeText(this.props.image.uuid);
            alertify.success('Image uuid copied to clipboard.');
        }
    }

}

export default ImageMetadata;