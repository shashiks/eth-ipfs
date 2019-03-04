// const HDWalletProvider = require('truffle-hdwallet-provider')
module.exports = {
  // contracts_build_directory: "./../contracts",
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: "5777"
    }
    // ,
    // rinkeby: {
    //   provider: function() {
    //     return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/4tyFJoKtfMPAzxBwkHoM", 0)
    //   },
    //   network_id: 4
    // }       
  }
};
