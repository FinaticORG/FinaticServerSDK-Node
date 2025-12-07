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
  const token = await finatic.getToken();
  const sessionResult = await finatic.startSession();
  const portalUrl = await finatic.getPortalUrl();

  if (!(await waitForPortalAuthentication(portalUrl))) {
    return;
  }

  const sessionUser = await finatic.getSessionUser();

  // Company methods
  // const company = await finatic.getCompany({ companyId: 'company-id' }); // Required: companyId

  // Broker methods
  const brokers = await finatic.getBrokers();
  const brokerConnections = await finatic.getBrokerConnections();
  // const disconnectResult = await finatic.disconnectCompanyFromBroker({ connectionId: 'connection-id' }); // Required: connectionId

  // Data methods - get* (single page)
  const accounts = await finatic.getAccounts();
  const orders = await finatic.getOrders();
  const positions = await finatic.getPositions();
  const balances = await finatic.getBalances();
  if (orders.success && orders.success.data) {
    console.log('We are in orders');
    const paginatedData = orders.success.data;
    console.log('orders length', paginatedData.length);
    console.log('orders toJSON', paginatedData.toJSON());
    if (paginatedData.hasMore) {
      console.log('orders has more');
      const nextOrder = await paginatedData.nextPage();
      const lastOrder = await paginatedData.lastPage();
      const firstOrder = await paginatedData.firstPage();
    }
  }
  // const orderFills = await finatic.getOrderFills({ orderId: 'order-id' }); // Required: orderId
  // const orderEvents = await finatic.getOrderEvents({ orderId: 'order-id' }); // Required: orderId
  const orderGroups = await finatic.getOrderGroups();
  const positionLots = await finatic.getPositionLots();
  // const positionLotFills = await finatic.getPositionLotFills({ lotId: 'lot-id' }); // Required: lotId

  // Data methods - getAll* (paginated, fetches all pages)
  const allAccounts = await finatic.getAllAccounts();
  const allOrders = await finatic.getAllOrders();
  const allPositions = await finatic.getAllPositions();
  const allBalances = await finatic.getAllBalances();
  // const allOrderFills = await finatic.getAllOrderFills({ orderId: 'order-id' }); // Required: orderId
  // const allOrderEvents = await finatic.getAllOrderEvents({ orderId: 'order-id' }); // Required: orderId
  const allOrderGroups = await finatic.getAllOrderGroups();
  const allPositionLots = await finatic.getAllPositionLots();
  // const allPositionLotFills = await finatic.getAllPositionLotFills({ lotId: 'lot-id' }); // Required: lotId
}

main().catch(console.error);
