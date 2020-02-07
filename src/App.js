import React from 'react';
import './css/App.css';
import './css/dashboard.css';
import Header from './components/Header'; 
import Sidemenu from './components/Sidemenu';
import ImportTool from './pages/ImportTool';
import Repositories from './pages/Repositories';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Router } from "@reach/router";
import Client from './MinervaClient';

class App extends React.Component {

  loginSuccess(token, user) {
    Client.setToken(token);
    Client.setUser(user);
  }

  render() {
    return (
      <div className="App">
        <Header loginSuccess={this.loginSuccess}/>
        <div className="container-fluid">
          <div className="row">
            <Sidemenu/>
            <main role="main" className="col-md-9 ml-sm-auto col-lg-10 px-4">
              <Router>
                <ImportTool path="/" />
                <Repositories path="repositories"/>
              </Router>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
