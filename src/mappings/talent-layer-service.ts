import { log, store, BigInt, DataSourceContext } from '@graphprotocol/graph-ts'
import { Platform, User } from '../../generated/schema'
import { ServiceData, ProposalData } from '../../generated/templates'
import {
  ServiceCreated,
  ServiceDetailedUpdated,
  ProposalCreated,
  ProposalUpdated,
  AllowedTokenListUpdated,
  MinCompletionPercentageUpdated,
} from '../../generated/TalentLayerService/TalentLayerService'
import {
  getOrCreateService,
  getOrCreateProposal,
  getOrCreateToken,
  getOrCreatePlatform,
  getOrCreateUser,
  getOrCreateProtocol,
} from '../getters'
import { generateIdFromTwoElements } from './utils'

export function handleServiceCreated(event: ServiceCreated): void {
  const service = getOrCreateService(event.params.id)
  service.createdAt = event.block.timestamp
  service.updatedAt = event.block.timestamp
  service.buyer = getOrCreateUser(event.params.ownerId).id
  service.status = 'Opened'
  const platform = getOrCreatePlatform(event.params.platformId)
  service.platform = platform.id
  service.cid = event.params.dataUri
  const dataId = event.params.dataUri + '-' + event.block.timestamp.toString()

  const context = new DataSourceContext()
  context.setBigInt('serviceId', event.params.id)
  context.setString('id', dataId)
  ServiceData.createWithContext(event.params.dataUri, context)

  service.description = dataId
  service.save()
}

export function handleServiceDetailedUpdated(event: ServiceDetailedUpdated): void {
  const serviceId = event.params.id
  const service = getOrCreateService(serviceId)
  const oldCid = service.cid
  const newCid = event.params.dataUri
  const dataId = newCid + '-' + event.block.timestamp.toString()

  //service.created set in handleServiceCreated.
  service.updatedAt = event.block.timestamp
  service.cid = newCid

  const context = new DataSourceContext()
  context.setBigInt('serviceId', serviceId)
  context.setString('id', dataId)

  if (oldCid) {
    store.remove('ServiceDescription', oldCid)
  }

  ServiceData.createWithContext(newCid, context)

  service.description = dataId
  service.save()
}

export function handleProposalCreated(event: ProposalCreated): void {
  const proposalId = generateIdFromTwoElements(event.params.serviceId.toString(), event.params.ownerId.toString())
  const proposal = getOrCreateProposal(proposalId, event.params.serviceId)
  proposal.status = 'Pending'

  proposal.service = getOrCreateService(event.params.serviceId).id
  proposal.seller = User.load(event.params.ownerId.toString())!.id
  const tokenAddress = event.params.rateToken
  let token = getOrCreateToken(tokenAddress)
  proposal.rateToken = tokenAddress.toHexString()
  proposal.rateAmount = event.params.rateAmount
  proposal.platform = Platform.load(event.params.platformId.toString())!.id
  proposal.expirationDate = event.params.expirationDate

  proposal.createdAt = event.block.timestamp
  proposal.updatedAt = event.block.timestamp

  const cid = event.params.dataUri
  proposal.cid = cid

  const dataId = cid + '-' + event.block.timestamp.toString()
  proposal.description = dataId

  const context = new DataSourceContext()
  context.setString('proposalId', proposalId)
  context.setString('id', dataId)
  ProposalData.createWithContext(cid, context)

  proposal.save()
}

export function handleAllowedTokenListUpdated(event: AllowedTokenListUpdated): void {
  const token = getOrCreateToken(event.params._tokenAddress)
  token.allowed = event.params._status
  token.minimumTransactionAmount = event.params._minimumTransactionAmount

  token.save()
}

export function handleProposalUpdated(event: ProposalUpdated): void {
  const token = event.params.rateToken
  const proposalId = generateIdFromTwoElements(event.params.serviceId.toString(), event.params.ownerId.toString())
  const proposal = getOrCreateProposal(proposalId, event.params.serviceId)
  const newCid = event.params.dataUri
  const oldCid = proposal.cid
  const dataId = newCid + '-' + event.block.timestamp.toString()

  proposal.rateToken = getOrCreateToken(token).id
  proposal.rateAmount = event.params.rateAmount

  //proposal.created set in handleProposalCreated.
  proposal.updatedAt = event.block.timestamp

  proposal.cid = newCid
  proposal.expirationDate = event.params._expirationDate
  const context = new DataSourceContext()
  context.setString('proposalId', proposalId)
  context.setString('id', dataId)

  if (oldCid) {
    store.remove('ProposalDescription', oldCid)
  }

  ProposalData.createWithContext(newCid, context)

  proposal.description = dataId
  proposal.save()
}

export function handleMinCompletionPercentageUpdated(event: MinCompletionPercentageUpdated): void {
  const protocol = getOrCreateProtocol()
  protocol.minServiceCompletionPercentage = event.params._minCompletionPercentage
  protocol.save()
}
