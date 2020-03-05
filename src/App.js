import React from 'react';
import './css/App.css';
import './css/dashboard.css';
import Header from './components/Header'; 
import ImportTool from './pages/ImportTool';
import Repositories from './pages/Repositories';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Router } from "@reach/router";
import Client from './MinervaClient';

class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      refresh: new Date()
    }
    this.loginSuccess = this.loginSuccess.bind(this);
    this.logoutSuccess = this.logoutSuccess.bind(this);
  }

  loginSuccess(token, user) {
    Client.setUser(user);
    Client.getCognitoDetails();
    this.setState({loggedIn: true});
    this.forceUpdate();
    console.log('loginSuccess');
  }

  logoutSuccess() {
    this.setState({loggedIn: false});
    this.forceUpdate();
    console.log('logoutSuccess');
  }

  render() {
    return (
      <div className="App text-light">
        <Header loginSuccess={this.loginSuccess} logoutSuccess={this.logoutSuccess} refresh={this.state.refresh}/>
        <Router className="container-fluid text-light">
          <ImportTool path="/import" loggedIn={this.state.loggedIn}/>
          <Repositories path="/" loggedIn={this.state.loggedIn} />
        </Router>
        <span className="copyright">©2020, Laboratory of Systems Pharmacology. All rights reserved.</span>
      </div>
    );
  }
}

export default App;
