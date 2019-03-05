pragma solidity >=0.4.21 <0.6.0;

contract DocRepo {   
    
    mapping (string => address[]) permittedAddrs;

    mapping (string => address) docToOwner;


    function setDocToOwner(string memory _docHash) public {
        docToOwner[_docHash] = msg.sender;
    }

    function permitAccessToAddr(string memory _docHash, address _shareTo) public {
        
        require(docToOwner[_docHash] == msg.sender, "User not authorized to share");
        permittedAddrs[_docHash].push(_shareTo);
    }

    function getDocOwner(string memory _docHash) public view returns (address) {
        return docToOwner[_docHash];
    }

    function isOwner(string memory _docId, address _testAddr) public view returns (bool) {
        return docToOwner[_docId] == _testAddr;
    }

    function deleteAll(string memory _docId) public { //dont want to do this in prod ;)
        docToOwner[_docId] = address(0);
        permittedAddrs[_docId].length = 0;
    }

    function isAuthorized(string memory _docHash, address _testAddr) public view returns (bool) {

        if(docToOwner[_docHash] == _testAddr){
            return true;
        }
    
        // bool res = false;
        address[] storage authed = permittedAddrs[_docHash];
        if(authed.length > 0) { //looping is never good, check for oveflow and loop till limited elements
            for(uint i=0; i< authed.length; i++) {
                if(authed[i] == _testAddr) {
                    return true;
                }
            }    
        }
        return false;
    }
}