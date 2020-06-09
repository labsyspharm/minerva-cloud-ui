import React from 'react';

class ImportHelpModal extends React.Component {
    render() {
        return (
            <div id={this.props.modalId} className="modal" tabIndex="-1" role="dialog" aria-labelledby="addChannelGroupModal" aria-hidden="true">
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title text-dark">Importing images</h5>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body text-dark">
                        <div>
                        <dl>
                            <dt>Create new repository</dt>
                            <dd>A repository is a place to store your images. You will be the admin of the repository, and you can control who has access to the images in the repository. You can also import to an existing repository.<br/><br/>
                            Selecting "Archive raw images" will keep a copy of the original image files in S3. If you're unsure, leave the checkbox unselected.</dd>
                            <dt>Select Repository</dt>
                            <dd>The image will be imported to this repository. By default, only people with access to the repository can see the image.</dd>
                            <dt>Select an image</dt>
                            <dd>Minerva supports importing .ome.tif files (recommended) and all BioFormats-compatible microscope formats such as .rcpnl.</dd>
                            <dt>Click "Start Import"</dt>
                            <dd>Don't close the browser while uploading file. It's safe to close the browser after the upload has completed. The import process will continue in the server, and once it's completed, you're able to see the image in the repository browser.</dd>
                        </dl>
                        </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default ImportHelpModal;