import {
  Link,
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";
import { useState } from 'react'
import {Helmet} from 'react-helmet';
import { Spinner, Navbar, Nav, Button, Container } from 'react-bootstrap'
import logo from '../content/images/logo.png'
import Home from './Home.js'
import MyTokens from './MyTokens.js'
import MyResales from './MyResales.js'
import '../content/css/App.css';
import {ConnectWallet, DisconnectWallet} from '../controller/AppControl.js';


function App() {
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState(null)
  const [contract, setContract] = useState({})

  const stateMethods = [loading, setLoading, account, setAccount, contract, setContract]

  return (
    <BrowserRouter>
      <div className="App">
          <Helmet> 
              <style>{'body { background-color: #e6e6e6; }'}</style>   
          </Helmet>
          <Navbar expand="lg" bg="dark" variant="dark">
            <Container>
              <Navbar.Brand>
                <img src={logo} width="40" height="40" className="" alt="" />
                &nbsp; Music-NFT Marketplace
              </Navbar.Brand>
              <Navbar.Toggle aria-controls="responsive-navbar-nav" />
              <Navbar.Collapse id="responsive-navbar-nav">
                <Nav className="me-auto"> 
                  {/* "Link is used to define the url" */}
                  <Nav.Link as={Link} to="/">Home</Nav.Link>  
                  <Nav.Link as={Link} to="/my-tokens">My Tokens</Nav.Link>
                  <Nav.Link as={Link} to="/my-resales">My Resales</Nav.Link>
                </Nav>
                <Nav>
                  {account ? (
                    [ <Nav.Link
                      href={`https://etherscan.io/address/${account}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button nav-button btn-sm mx-4">

                      <Button variant="outline-warning">
                        {account.slice(0, 5) + '...' + account.slice(38, 42)}
                      </Button>
                    </Nav.Link>
                    ,
                    <Button onClick={async () => DisconnectWallet(stateMethods)} variant="outline-danger">Logout</Button>
                    ]
                  ) : (
                    <Button onClick={async () => ConnectWallet(stateMethods)} variant="outline-light">Connect Wallet</Button>
                  )}
                </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>
        <div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
              <Spinner animation="grow" style={ { display: 'flex', color:'yellow'} } />
              <p className='mx-3 my-0'>Awaiting Wallet Connection...</p>
            </div>
          ) : (
            <Routes>   
              <Route path="/" element={
                <Home contract={contract} />
              } />
              <Route path="/my-tokens" element={
                <MyTokens contract={contract} />
              } />
              <Route path="/my-resales" element={
                <MyResales contract={contract} account={account} />
              } />
            </Routes>
          )}
        </div>  
      </div>
    </BrowserRouter>

  );
}

export default App;