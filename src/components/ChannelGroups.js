import React from 'react';

class ChannelGroups extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            selected: 0
        };
    }

    select(item, index) {
        this.setState({selected: index});
        this.props.onChannelGroupSelected(item.uuid);
    }

    render() {
        console.log('groups: ', this.props.groups);
        if (!this.props.groups) {
            return null;
        }
        return (
            <div className="btn-group-toggle" data-toggle="buttons">
                {this.props.groups.map((item, index) => {
                    let clazz = "btn btn-secondary btn-sm btn-block";
                    if (this.state.selected === index) {
                        clazz += " active";
                    }
                    return (
                        <label className={clazz} key={index}>
                            <input type="checkbox" onClick={() => this.select(item, index)}/>{item.label}
                        </label>
                        );
                    })}
                    
            </div>
        );
    }

}

export default ChannelGroups;