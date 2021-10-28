import React from 'react';
import Range from './Range';

class RenderingSettings extends React.Component {

    addChannel(item, index) {
        this.props.onAdd(index);
    }

    render() {
        if (!this.props.channelGroup) {
            return null;
        }
        return (
            <div>
                { this.props.channelGroup.channels.map((channel, index) => (
                      <div key={index}>
                          <Range channel={channel}
                                 channelGroup={this.props.channelGroup}
                                 handleChange={this.props.handleChange}
                                 onDelete={this.props.onDelete}
                                 guest={this.props.guest}
                          />
                      </div>
                    ))
                }
                <div>
                <div class="dropdown">
                    <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Add channel
                    </button>
                    <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                        {this.props.metadata.pixels.channels.map((item, index) => {
                        return (
                            <a className="dropdown-item" key={index} href="#" onClick={() => this.addChannel(item, index)}>
                                {item.Name || item.ID}
                            </a>
                            );
                        })}
                    </div>
                </div>
                </div>
            </div>
        );
    }


}

export default RenderingSettings;