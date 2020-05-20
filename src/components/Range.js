import React from 'react';
import { Slider, Typography } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faEyeSlash, faPaintBrush, faTimes } from '@fortawesome/free-solid-svg-icons'
import { SketchPicker } from "react-color";
import '../css/Range.css';

class Range extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            showColorPicker: false
        }

        this.handleChange = this.handleChange.bind(this);
        this.handleChangeCommitted = this.handleChangeCommitted.bind(this);
        this.toggle = this.toggle.bind(this);
        this.showColorPicker = this.showColorPicker.bind(this);
        this.colorChanged = this.colorChanged.bind(this);
        this.removeChannel = this.removeChannel.bind(this);
    }

    handleChange(evt, values) {
        this.props.channel.min = values[0] / 65535;
        this.props.channel.max = values[1] / 65535;
        this.props.handleChange(this.props.channelGroup, this.props.channel, false);
    }

    handleChangeCommitted(evt, values) {
        this.props.channel.min = values[0] / 65535;
        this.props.channel.max = values[1] / 65535;
        this.props.handleChange(this.props.channelGroup, this.props.channel, true);
    }

    toggle() {
        this.props.channel.disabled = !this.props.channel.disabled;
        this.props.handleChange(this.props.channelGroup, this.props.channel, true);
    }

    showColorPicker() {
        this.setState({showColorPicker: !this.state.showColorPicker});
    }

    colorChanged(color) {
        this.setState({showColorPicker: false});
        this.props.channel.color = color.hex.substr(1);
        this.props.handleChange(this.props.channelGroup, this.props.channel, true);
    }

    removeChannel() {
        this.props.onDelete(this.props.channelGroup, this.props.channel);
    }

    render() {
        let range = [Math.round(this.props.channel.min * 65535),
                     Math.round(this.props.channel.max * 65535)];
        let toggleIcon = this.props.channel.disabled ? faEyeSlash: faEye;
        return (
            <div>
                { this.state.showColorPicker ?
                    <div className="channel-color-picker">
                        <SketchPicker color={ this.props.channel.color} 
                            onChange={ this.colorChanged } 
                            disableAlpha={true}
                            presetColors={['#ffffff','#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#ffff00', '#00ffff']}
                            />
                    </div>
                    : null }

                <Typography id="range-slider" gutterBottom>
                    <button type="button" className="btn btn-secondary float-left" onClick={this.toggle} disabled={this.props.guest}>
                        <FontAwesomeIcon icon={toggleIcon} />
                    </button>&nbsp;
                    <button style={{ backgroundColor: '#' + this.props.channel.color}} type="button" className="btn float-left" onClick={this.showColorPicker} disabled={this.props.guest}>
                        <FontAwesomeIcon icon={faPaintBrush} />
                    </button>
                    {this.props.channel.id} - {this.props.channel.label}
                    <button type="button" className="btn float-right btn-secondary" onClick={this.removeChannel} disabled={this.props.guest}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </Typography>
                
                <div className="custom-slider">
                <Slider
                    value={range}
                    min={0}
                    max={65535}
                    color="primary"
                    onChange={this.handleChange}
                    onChangeCommitted={this.handleChangeCommitted}
                    valueLabelDisplay="auto"
                    aria-labelledby="range-slider"
                    getAriaValueText={ value => Math.round(value)}
                    disabled={this.props.guest}
                />
                </div>
            </div>
        );
    }
}

export default Range;