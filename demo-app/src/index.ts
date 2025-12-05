#!/usr/bin/env node

/**
 * Finatic Server SDK Node.js Usage Example
 * 
 * This file demonstrates all public methods of the Finatic Server SDK.
 */

import 'dotenv/config';
import { FinaticServer } from '@finatic/server-node';
import inquirer from 'inquirer';

// Configuration from environment variables
const API_URL = process.env.FINATIC_API_URL || 'https://api.finatic.dev';
const API_KEY = process.env.FINATIC_API_KEY!;

async function waitForPortalAuthentication(portalUrl: string): Promise<boolean> {
  console.log('\n🌐 Please visit this URL to authenticate:');
  console.log(portalUrl);
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: 'Have you completed authentication in the portal?',
      default: false,
    },
  ]);
  
  if (!confirmed) {
    console.log('Authentication not completed. Exiting...');
    return false;
  }
  
  return true;
}

async function main() {
  // Initialize SDK
  const finatic = await FinaticServer.init(API_KEY, undefined, {
    baseUrl: API_URL,
    logLevel: 'debug',
    structuredLogging: true,
  });

  // Session methods
  const token = await finatic.getToken(); // Optional: getToken('custom-api-key')
  const sessionResult = await finatic.startSession(); // Optional: startSession('one-time-token', 'user-id')
  const portalUrl = await finatic.getPortalUrl(); // Optional: getPortalUrl('theme', ['broker1'], 'email', 'mode')
  
  if (!(await waitForPortalAuthentication(portalUrl))) {
    return;
  }
  
  const sessionUser = await finatic.getSessionUser();

  // Company methods
  const company = await finatic.getCompany({ companyId: 'company-id' }); // Required: companyId

  // Broker methods
  const brokers = await finatic.getBrokers(); // Optional: getBrokers({})
  const brokerConnections = await finatic.getBrokerConnections(); // Optional: getBrokerConnections({})
  const disconnectResult = await finatic.disconnectCompanyFromBroker({ connectionId: 'connection-id' }); // Required: connectionId

  // Data methods - getAll* (paginated, fetches all pages)
  const allAccounts = await finatic.getAllAccounts(); // Optional: getAllAccounts({ accountId: 'id', brokerId: 'id' })
  const allOrders = await finatic.getAllOrders(); // Optional: getAllOrders({ accountId: 'id', brokerId: 'id', status: 'status' })
  const allPositions = await finatic.getAllPositions(); // Optional: getAllPositions({ accountId: 'id', brokerId: 'id' })
  const allBalances = await finatic.getAllBalances(); // Optional: getAllBalances({ accountId: 'id', brokerId: 'id' })
  const allOrderFills = await finatic.getAllOrderFills({ orderId: 'order-id' }); // Required: orderId
  const allOrderEvents = await finatic.getAllOrderEvents({ orderId: 'order-id' }); // Required: orderId
  const allOrderGroups = await finatic.getAllOrderGroups(); // Optional: getAllOrderGroups({ accountId: 'id', brokerId: 'id' })
  const allPositionLots = await finatic.getAllPositionLots(); // Optional: getAllPositionLots({ accountId: 'id', brokerId: 'id' })
  const allPositionLotFills = await finatic.getAllPositionLotFills({ lotId: 'lot-id' }); // Required: lotId

  // Data methods - get* (single page)
  const accounts = await finatic.getAccounts(); // Optional: getAccounts({ accountId: 'id', brokerId: 'id', limit: 10, offset: 0 })
  const orders = await finatic.getOrders(); // Optional: getOrders({ accountId: 'id', brokerId: 'id', status: 'status', limit: 10, offset: 0 })
  const positions = await finatic.getPositions(); // Optional: getPositions({ accountId: 'id', brokerId: 'id', limit: 10, offset: 0 })
  const balances = await finatic.getBalances(); // Optional: getBalances({ accountId: 'id', brokerId: 'id', limit: 10, offset: 0 })
  const orderFills = await finatic.getOrderFills({ orderId: 'order-id' }); // Required: orderId, Optional: { limit: 10, offset: 0 }
  const orderEvents = await finatic.getOrderEvents({ orderId: 'order-id' }); // Required: orderId, Optional: { limit: 10, offset: 0 }
  const orderGroups = await finatic.getOrderGroups(); // Optional: getOrderGroups({ accountId: 'id', brokerId: 'id', limit: 10, offset: 0 })
  const positionLots = await finatic.getPositionLots(); // Optional: getPositionLots({ accountId: 'id', brokerId: 'id', limit: 10, offset: 0 })
  const positionLotFills = await finatic.getPositionLotFills({ lotId: 'lot-id' }); // Required: lotId, Optional: { limit: 10, offset: 0 }
}

main().catch(console.error);
