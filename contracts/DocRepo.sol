pragma solidity >=0.4.21 <0.6.0;

contract DocRepo {   
    
    mapping (bytes32 => address[]) permittedAddrs;

    mapping (bytes32 => address) docToOwner;


    function setDocToOwner(bytes32 _docHash) public {
        docToOwner[_docHash] = msg.sender;
        permittedAddrs[_docHash].push(msg.sender);
    }

    function permitAccessToAddr(bytes32 _docHash) public {
        permittedAddrs[_docHash].push(msg.sender);
    }

    function getDocOwner(bytes32 _docHash) public view returns (address) {
        return docToOwner[_docHash];
    }

    function isOwner(bytes32 _docId, address _testAddr) public view returns (bool) {
        return docToOwner[_docId] == _testAddr;
    }

    function deleteAll(bytes32 _docId) public { //dont want to do this in prod ;)
        docToOwner[_docId] = address(0);
        permittedAddrs[_docId].length = 0;
    }

    function isAuthorized(bytes32 _docHash, address _testAddr) public view returns (address[] memory) {

        return permittedAddrs[_docHash];
        // if(docToOwner[_docHash] == _testAddr){
        //     return true;
        // }
    
        // // bool res = false;
        // address[] storage authed = permittedAddrs[_docHash];
        // if(authed.length > 0) { //empty array (should do 0 index chk too)
        //     for(uint i=0; i< authed.length; i++) {
        //         if(authed[i] == _testAddr) {
        //             return true;
        //         }
        //     }    
        // }
        // return false;
    }
}