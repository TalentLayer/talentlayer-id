import { log, ipfs, json, Bytes, dataSource } from '@graphprotocol/graph-ts'
import { ServiceDescription, ProposalDescription } from '../../generated/schema'

//Adds metadata from ipfs as a entity called Description.
//The description entity has the id of the cid to the file on IPFS
//Keywords are transformed so that they are only single worded and comma seperated.
//Keywords are currently stored in two versions, in their raw format as keywords_raw and in a transformed format called keywords.
export function handleServiceData(content: Bytes): void {
  let context = dataSource.context();
  let serviceId = context.getString("serviceId");
  let cid = dataSource.stringParam()
  let description = new ServiceDescription(cid)

  if(serviceId){
    var services = description.services
    if(services){
      services.push(serviceId)
    } else {
      services = [serviceId]
    }
    description.services = services
  } else {
    log.error("Requsted a serviceId, but none was given.", [])
    return
  }
  
  const value = json.fromBytes(content).toObject();

  if(value){
    const title = value.get('title');
    const about = value.get('about');
    let keywords = value.get('keywords');
    const role = value.get('role');
    const rateToken = value.get('rateToken');
    const rateAmount = value.get('rateAmount');
    
    if(title){
      description.title = title.toString();
    } 

    if(about){
      description.about = about.toString();
    } 

    if(role){
      description.role = role.toString();
    }

    if(rateToken){
      description.rateToken = rateToken.toString();
    }

    if(rateAmount){
      // currently throws an error on hosted services
      // log.info("------------- {}", [rateAmount.kind.toString()])
      // description.rateAmount = rateAmount.toString();
      // log.info("F5 {}", [rateAmount.toString()])
    }

    if(keywords){
      //Transforms keywords into lowercase, semicolumn seperated keywords in an array.
      var _keywords = keywords.toString().toLowerCase();
      description.keywords_raw = _keywords;
      _keywords = _keywords.replaceAll(", ", ",");
      _keywords = _keywords.replaceAll(" ", ",");
      description.keywords = _keywords.split(","); 
    }
    description.save();
  }
}

export function handleProposalData(content: Bytes): void {
  let context = dataSource.context();
  let proposalId = context.getString('proposalId');
  let cid = dataSource.stringParam()
  let description = new ProposalDescription(cid)

  if(proposalId){
    var proposals = description.proposals
    if(proposals){
      proposals.push(proposalId)
    } else {
      proposals = [proposalId]
    }
    description.proposals = proposals
  } else {
    log.error("Requsted a proposalId, but none was given.", [])
    return
  }

  description.save()

}