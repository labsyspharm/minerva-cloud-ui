import React from 'react';
import Client from '../MinervaClient';

class RepositorySelect extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            repositories: [],
            repository: null
        };
    }

    componentDidMount() {
        this.loadRepositories();
    }

    loadRepositories() {
        Client.getRepositories().then(res => {
            let repositories = [];
            repositories = repositories.concat(res.included.repositories);
            this.setState({ repositories: repositories });
        });
    }

    selectRepository(item) {
        this.setState({ repository: item });
        this.props.onSelect(item);
    }

    render() {
        let repositoryText = 'Click to select';
        if (this.state.repository) {
            repositoryText = this.state.repository.name;
        }

        return (
            <div className="dropdown">
                {this.state.repositoriesChanged}
                <label htmlFor="repositoryDropdown">Select repository:</label>
                <button className="form-control btn btn-secondary dropdown-toggle" type="button" id="repositoryDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    {repositoryText}
                </button>
                {this.renderRepositoryChoices()}
            </div>
        )
    }

    renderRepositoryChoices() {
        let choices = this.state.repositories.map((item, index) =>
            <a href="#" className="dropdown-item" onClick={() => this.selectRepository(item)} key={index}>{item.name}</a>
        );
        return (
            <div className="dropdown-menu" aria-labelledby="repositoryDropdown">
                {choices}
            </div>
        );
    }
}

export default RepositorySelect;