import React, { Component } from 'react';
import contract from 'truffle-contract';
import DocRepo from '../build/contracts/DocRepo.json';
import Web3 from 'web3';
import IPFS from 'ipfs-api';

import './css/pure-min.css'
import './App.css'

var ipfs = new IPFS({ host: 'localhost', port: 5001});

var docRepo = contract(DocRepo);
var me = null;
var web3 = window.web3;
var ethereum = window.ethereum;

window.addEventListener('load', async () => {
    // Modern dapp browsers...
    if (window.ethereum) {
        web3 = new Web3(ethereum);
        try {
            // Request account access if needed
            await ethereum.enable();
            web3 = new Web3(web3.currentProvider);
            docRepo.setProvider(web3.currentProvider);
            // Acccounts now availablw
        } catch (error) {
            alert('user denied access');
        }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
        web3 = new Web3(web3.currentProvider);
        // Acccounts always exposed
        docRepo.setProvider(web3.currentProvider);
    }
    // Non-dapp browsers...
    else {
        console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
});

class App extends Component {


    
	constructor (props) {
		super(props);
		this.state = {
            view: 'add',
            msg : '',
            fileData: '',
            tranId: ''
		}
		me = this;
		
	}

    reset() {
        this.setState({
            msg : '',
            tranId: ''
        })
        return true;
    }


    fileToBuffer = async(reader) => {
        const buffer = await Buffer.from(reader.result);
        this.setState({fileData: buffer});        
    }

    readFile = (event) => {
        event.stopPropagation();
        event.preventDefault();
        const file = event.target.files[0];
        let reader = new window.FileReader();
        reader.readAsArrayBuffer(file);
        reader.onloadend = () => this.fileToBuffer(reader) ; 
    }

	addDoc = () => {
        console.log('add a doc');
        this.reset();
        console.log('have buffer ' + this.state.fileData.length);
        let currUser = window.web3.eth.defaultAccount;
        console.log('Curr user : ' + currUser);
        

        try {
            ipfs.add(this.state.fileData, (err, ipfsHash) => {
                if(err) {
                    console.error("Err Adding new Doc  "+ err);
                    me.setState({msg : "Err writing to IPFS " +  err});
                    return;        
                }
                console.log(' doc hash ' + ipfsHash[0].hash);
                let docId = ipfsHash[0].hash;
                this.setState({ tranId: 'Doc Hash added to IPFS => ' + docId });
                //add the  hash to eth contract now
                docRepo.deployed().then(function(instance) {
                    console.log('instance ' + instance.address);
                    try {
                        instance.setDocToOwner.sendTransaction(docId, {gas:200000, from: currUser}).then( function(ethTxnId) {
                            console.log('eth txn id' + ethTxnId);
                            me.setState({msg : " ETH Txn Id => " +  ethTxnId});
                        });
                    } catch (err) {
                        console.error("Err Addinng new Doc  "+ err);
                        me.setState({msg : " ERR writing to ETH " +  err});
                        return;
                    }
                });
            }) // ipfs.add 
        } catch (err) {
            console.error("Err Addinng new Doc  "+ err);
            me.setState({msg : " connecting to IPFS " +  err});
            return;
        }
		
	}

	getDoc = () => {
        this.reset();
        let docId = this.refs.pDocId.value;
        // let docId = 'Qme6PDa1TNjuquYVVyQT1vMwv9k7RVergQfu2XiDRTieeq';
        console.log('doc id ' + docId);
        let currUser = window.web3.eth.defaultAccount;
        console.log('Curr user : ' + currUser);
        
        docRepo.deployed().then(function(instance) {
            console.log('instance ' + instance.address);
            let isPermitted = false;
            instance.isAuthorized.call(docId, currUser).then(function(authed) {
                console.log('authed ' +JSON.stringify(authed));
                if(authed.length == 0) {
                    me.setState({msg : "ERROR :: No user authorized for document or no document."}); 
                    return;
                }
                for(let i=0; i< authed.length; i++) {
                    console.log('comparing ' + (authed[i] === currUser.toString()));
                    if(authed[i] === currUser.toString()) {
                        isPermitted = true;
                        break;
                    }
                }
                console.log('isPermi ' + isPermitted);
                if(isPermitted === true) {
                    ipfs.get(docId, function (err, files) {
                        files.forEach((file) => {
                        //   console.log(file.path);
                          me.setState({msg : " File Content => " +  file.content.toString('utf8')});
                        //   console.log(file.content.toString('utf8'))
                        })
                      })
                } else {
                    me.setState({msg: "ERROR :: User not authorized to view document"});
                }
            });
        });		
    }
    
    shareDoc = () => {
        console.log('add a doc');
        this.reset();
        let docId = this.refs.pShareDocId.value;
        let currUser = window.web3.eth.defaultAccount;
        console.log('Curr user : ' + currUser);
        console.log('doc id ' + docId);
        docRepo.deployed().then(function(instance) {
            console.log('instance ' + instance.address);
            try {
                instance.permitAccessToAddr.sendTransaction(docId, {gas:300000, from: window.web3.eth.defaultAccount}).then( function(id) {
                    console.log('eth txn id' + id);
                    me.setState({msg : " ETH Txn Id => " +  id});
                });
            } catch (err) {
                console.error("Err Addinng new Doc  "+ err);
                me.setState({msg : " ERR writing to ETH " +  err});
                return;
            }
        });
    }
    
    clearAll() {
        this.reset();
        let currUser = window.web3.eth.defaultAccount;
        let docId = this.refs.pShareDocId.value;
        docRepo.deployed().then(function(instance) {
            console.log('instance ' + instance.address);
            try {
                instance.deleteAll.sendTransaction(docId, {gas:300000, from: currUser}).then( function(id) {
                    console.log('eth txn id' + id);
                    // me.setState({msg : " ETH Txn Id => " +  id});
                });
            } catch (err) {
                console.error("Err Addinng new Doc  "+ err);
                // me.setState({msg : " ERR writing to ETH " +  err});
                // return;
            }
        });        
    }

// 	getReceipt = () => {
// 		var v = this.refs.txnRefId.value;
// 		web3.eth.getTransactionReceipt(v, function(err, receipt){
// 			var txnMsg = "Status : ";
// 			if(receipt.status === "0x1") { //success
// 				txnMsg = "Sucess </br>";
// 			}
// 			if(receipt.status === "0x0") { //failure
// 				txnMsg = "Failure </br>";
// 			}
// 			if(!receipt.status) { //unknown
// 				txnMsg = "Unknown Failure </br>";
// 			}
// 			txnMsg += "Block Id : " + receipt.blockHash + "</br>";
// 			txnMsg += "Total gas used : " + receipt.cumulativeGasUsed;

// 			me.setState({resultMsg: txnMsg});
// 		});
// 	}
	clear = () => {
		this.setState({txnId : ''});
		this.setState({resultMsg : ''});
	}

	

	render() {
		return (
			<div className="App">
                <main className="container">
                    <div className="l-box">
                        <div className="pure-u-1">
                            <h2>Ethereum Document Repository</h2>
                        </div>  
                    </div>
					 <div className="l-box">
                        <div className="pure-u-1" align="center">   
                          <div dangerouslySetInnerHTML={{__html: this.state.tranId}} />
                           <div dangerouslySetInnerHTML={{__html: this.state.msg}} />                 
                        </div>  
                    </div>
                        <div className="pure-g">
                            <div className="pure-u-1-5"> 
                                <div className="pure-u-1">
                                        <div className="l-box"><a className="pure-menu-link" onClick={ () => { this.clear(); this.setState({view : 'add'}) } }>Add Document</a></div>
                                        <div className="l-box"><a className="pure-menu-link" onClick={ () => {this.clear();  this.setState({view : 'view'})}}>View Document</a></div>
                                        <div className="l-box"><a className="pure-menu-link" onClick={ () => { this.clear(); this.setState({view : 'share'})}}>Share Document</a> </div>
{/*                                         <div className="l-box"><a className="pure-menu-link" onClick={ () => { this.initOptionList(); this.setState({view : 'receipt'}) } }>Check Status</a></div> */}
                                </div>
                            </div>
							<div className="pure-u-4-5"> 
								<div className="pure-u-1">
									{this.state.view === 'add' &&
                                                <form className="pure-form pure-form-stacked">
													<fieldset>
														<legend>Add Document</legend>
														<input type = "file" onChange = {this.readFile} />
														<button type="button" className="pure-button pure-button-primary" onClick={ () => { this.addDoc()}}>Add</button>
														<button type="reset" className="pure-button">Cancel</button>
													</fieldset>
												</form>
                                     }
                                    {this.state.view === 'view' && 
                                                <form className="pure-form pure-form-aligned">
													<fieldset>
														<div className="l-box">
															<legend>Retrieve Document</legend>
                                                            <input ref="pDocId" defaultValue='Qme6PDa1TNjuquYVVyQT1vMwv9k7RVergQfu2XiDRTieeq' placeholder="Document Id" />
														</div>
														<div className="l-box">
														<button onClick={() => { this.getDoc()}} type="button" className="pure-button pure-button-primary">Retrieve</button>
														<button type="submit" className="pure-button">Cancel</button>
														</div>
													</fieldset>
												</form>
                                        }
                                        {this.state.view === 'share' &&
											<form className="pure-form pure-form-aligned">
                                            <fieldset>
                                                <div className="l-box">
                                                    <legend>Share your Document</legend>
                                                    <input ref="pShareDocId" defaultValue='Qme6PDa1TNjuquYVVyQT1vMwv9k7RVergQfu2XiDRTieeq' placeholder="Document Id" />
                                                    <input ref="pShareAddr" placeholder="Share With" />
                                                </div>
                                                <div className="l-box">
                                                <button onClick={() => { this.shareDoc()}} type="button" className="pure-button pure-button-primary">Share</button>
                                                <button onClick={() => { this.clearAll()}} type="button" className="pure-button">Clear All</button>
                                                </div>
                                            </fieldset>
                                        </form>
										}
								</div>
							</div>	
                        </div>
                </main> 
            </div>  
		);
	}
}

export default App;