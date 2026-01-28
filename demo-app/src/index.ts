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
  // const token = await finatic.getToken();
  // const sessionResult = await finatic.startSession();
  const portalUrl = await finatic.getPortalUrl();

  if (!(await waitForPortalAuthentication(portalUrl))) {
    return;
  }

  // const sessionUser = await finatic.getSessionUser();

  // Company methods
  // const company = await finatic.getCompany({ companyId: 'company-id' }); // Required: companyId

  // Broker methods
  // const brokers = await finatic.getBrokers();
  // const brokerConnections = await finatic.getBrokerConnections();
  // const disconnectResult = await finatic.disconnectCompanyFromBroker({ connectionId: 'connection-id' }); // Required: connectionId

  // Data methods - get* (single page)
  // const accounts = await finatic.getAccounts();
  // const orders = await finatic.getOrders();
  // const positions = await finatic.getPositions();
  // const balances = await finatic.getBalances();
  // const transactions = await finatic.getTransactions();
  // if (orders.success && orders.success.data) {
  //   console.log('We are in orders');
  //   const paginatedData = orders.success.data;
  //   console.log('orders length', paginatedData.length);
  //   console.log('orders toJSON', paginatedData.toJSON());
  //   if (paginatedData.hasMore) {
  //     console.log('orders has more');
  //     const nextOrder = await paginatedData.nextPage();
  //     const lastOrder = await paginatedData.lastPage();
  //     const firstOrder = await paginatedData.firstPage();
  //   }
  // }
  // const orderFills = await finatic.getOrderFills({ orderId: 'order-id' }); // Required: orderId
  // const orderEvents = await finatic.getOrderEvents({ orderId: 'order-id' }); // Required: orderId
  // const orderGroups = await finatic.getOrderGroups();
  // const positionLots = await finatic.getPositionLots();
  // const positionLotFills = await finatic.getPositionLotFills({ lotId: 'lot-id' }); // Required: lotId

  // Data methods - getAll* (paginated, fetches all pages)
  // COMMENTED OUT - focus on trading
  // const allAccounts = await finatic.getAllAccounts();
  // const oneAccount = allAccounts.success.data[0];
  // const allOrders = await finatic.getAllOrders({
  //   accountId: oneAccount.accountId,
  //   orderStatus: 'filled',
  // });
  // const allPositions = await finatic.getAllPositions({ accountId: oneAccount.accountId });
  // const allBalances = await finatic.getAllBalances({ accountId: oneAccount.accountId });
  // const allTransactions = await finatic.getAllTransactions({ accountId: oneAccount.accountId });
  // const allPositionLots = await finatic.getAllPositionLots({ accountId: oneAccount.accountId });
  // const allOrderGroups = await finatic.getAllOrderGroups();

  // Trading methods - ACTIVE for testing
  // Get an account first (you'll need to uncomment getAllAccounts above or provide account details)
  // For now, using placeholder values - update these with your actual account details
  const testAccountNumber = 123456789; // Replace with your account number
  const testBroker = 'robinhood'; // Replace with your broker
  const testConnectionId = undefined; // Optional: replace with your connectionId if available

  const placeOrderResult = await finatic.placeOrder({
    broker: testBroker,
    accountNumber: testAccountNumber,
    order: {
      orderType: 'market',
      assetType: 'equity',
      action: 'buy',
      timeInForce: 'day',
      symbol: 'AAPL',
      orderQty: 1,
    },
    // connectionId: testConnectionId, // Optional
  });
  console.log('placeOrderResult', placeOrderResult);

  // Other trading methods - COMMENTED OUT for now
  // const modifyOrderResult = await finatic.modifyOrder({
  //   orderId: 'order-id',
  //   broker: testBroker,
  //   accountNumber: testAccountNumber,
  //   order: {
  //     orderType: 'market',
  //     assetType: 'equity',
  //     action: 'buy',
  //     timeInForce: 'day',
  //     symbol: 'AAPL',
  //     orderQty: 2,
  //   },
  // });
  // console.log('modifyOrderResult', modifyOrderResult);

  // const cancelOrderResult = await finatic.cancelOrder({
  //   orderId: 'order-id',
  // });
  // console.log('cancelOrderResult', cancelOrderResult);
}

main().catch(console.error);
