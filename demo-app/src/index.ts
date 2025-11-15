#!/usr/bin/env node

/**
 * Finatic Server SDK Node.js Demo Application
 * 
 * This demo showcases the main features of the Finatic Server SDK:
 * - Authentication (Portal and Direct)
 * - Portfolio Management
 * - Trading Operations
 * - Broker Management
 */

import 'dotenv/config';
import { FinaticServer } from '@finatic/server-node';
import inquirer from 'inquirer';
import chalk from 'chalk';

// Configuration
const API_URL = process.env.FINATIC_API_URL || 'https://api.finatic.dev';
const API_KEY = process.env.FINATIC_API_KEY;
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@finatic.com';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'demo_password_123';
const ACCOUNT_ID_FILTER = '1c0e6a5e-f6d7-4af8-b69d-09aa17f73762';

// Check for required environment variables
if (!API_KEY) {
  console.error(chalk.red('❌ Error: FINATIC_API_KEY environment variable is required'));
  console.log(chalk.yellow('\n📝 Please create a .env file with:'));
  console.log(chalk.gray('FINATIC_API_URL=https://api.finatic.dev'));
  console.log(chalk.gray('FINATIC_API_KEY=your_api_key_here'));
  console.log(chalk.gray('\nFor localhost testing:'));
  console.log(chalk.gray('FINATIC_API_URL=http://localhost:8000'));
  process.exit(1);
}

// TypeScript assertion since we've checked API_KEY is not undefined
const apiKey: string = API_KEY;

class FinaticDemo {
  private client: FinaticServer;

  constructor() {
    // Initialize client like Python SDK - only API key required
    // baseUrl is optional and defaults to https://api.finatic.dev
    // For localhost testing, pass the API_URL as second parameter
    // Enable debug logging in dev mode
    const isDev = process.env.NODE_ENV !== 'production' || API_URL.includes('localhost');
    this.client = new FinaticServer(apiKey, API_URL, {
      logLevel: isDev ? 'debug' : 'error',
      structuredLogging: true,
    });
  }

  async run() {
    console.log(chalk.blue.bold('\n🚀 Finatic Server SDK Node.js Demo\n'));
    console.log(chalk.gray('This demo follows the actual Python SDK authentication flow.\n'));

    // Show configuration
    console.log(chalk.gray('Configuration:'));
    console.log(chalk.gray(`  API URL: ${API_URL}`));
    console.log(chalk.gray(`  API Key: ${apiKey.substring(0, 10)}...\n`));

    try {
      // Step 1: Initialize SDK
      console.log(chalk.yellow('Step 1: Initializing SDK...'));
      await this.client.initialize();
      console.log(chalk.green('✅ SDK initialized successfully'));

      // Quick check: fetch a one-time token for the Client SDK
      console.log(chalk.yellow('\nStep 1.1: Getting one-time token (server ➜ client helper)...'));
      try {
        const oneTimeToken = await this.client.initSession(apiKey);
        console.log(chalk.green('✅ One-time token fetched successfully'));
        console.log(chalk.gray(`Token (truncated): ${oneTimeToken.substring(0, 12)}...`));
      } catch (e) {
        console.log(chalk.red('❌ Failed to fetch one-time token'));
        console.log(chalk.gray('This does not affect the server session flow; continuing...'));
      }
      
      // Step 2: Start session
      console.log(chalk.yellow('\nStep 2: Starting session...'));
      try {
        // For server SDK, we need to use API key-based auth
        // First get a one-time token using initSession
        const oneTimeToken = await this.client.initSession(apiKey);
        // Then start session with the token
        const sessionResponse = await this.client.startSession(oneTimeToken);
        const sessionId = sessionResponse.session_id || this.client.getSessionId();
        console.log(chalk.green(`✅ Session started: ${sessionId}`));
        
        // Step 3: Get portal URL
        console.log(chalk.yellow('\nStep 3: Getting portal URL...'));
        const portalUrl = await this.client.getPortalUrl();
        console.log(chalk.green('✅ Portal URL retrieved'));
        console.log(chalk.blue(`\n🌐 Please visit this URL to authenticate:`));
        console.log(chalk.cyan(portalUrl));
      } catch (error: any) {
        if (error.message?.includes('401')) {
          console.log(chalk.red('❌ Authentication failed (401)'));
          console.log(chalk.yellow('💡 This usually means:'));
          console.log(chalk.gray('  • Invalid API key'));
          console.log(chalk.gray('  • API endpoint not accessible'));
          console.log(chalk.gray('  • Network connectivity issues'));
          console.log(chalk.yellow('\n🔧 To fix this:'));
          console.log(chalk.gray('  1. Check your .env file has a valid FINATIC_API_KEY'));
          console.log(chalk.gray('  2. Verify the API_URL is correct'));
          console.log(chalk.gray('  3. For localhost testing, ensure your local API is running'));
          return;
        }
        throw error;
      }
      
      // Step 4: Wait for user confirmation
      console.log(chalk.yellow('\nStep 4: Waiting for authentication...'));
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: 'Have you completed authentication in the portal?',
          default: false,
        },
      ]);

      if (!confirmed) {
        console.log(chalk.red('❌ Authentication not completed. Exiting...'));
        return;
      }

      // Step 5: Get session user (this completes authentication)
      console.log(chalk.yellow('\nStep 5: Getting authenticated user...'));
      const userInfo = await this.client.getSessionUser();
      console.log(chalk.green('✅ User authenticated successfully!'));
      console.log(chalk.gray(`User ID: ${userInfo.user_id}`));
      console.log(chalk.gray(`Company ID: ${userInfo.company_id}`));
      console.log(chalk.gray(`Token Type: ${userInfo.token_type}`));
      
      // Track core method results
      const coreResults = {
        passed: 0,
        failed: 0,
        total: 0,
      };

      // Helper to test core methods and track results
      const testCore = async (name: string, fn: () => Promise<any>, showDetails: boolean = true): Promise<any> => {
        coreResults.total++;
        try {
          const result = await fn();
          coreResults.passed++;
          if (showDetails) {
            console.log(chalk.gray(`  ✅ ${name}`));
          }
          return result;
        } catch (error: any) {
          coreResults.failed++;
          console.log(chalk.red(`  ❌ ${name} (${error.message?.substring(0, 50) || 'error'})`));
          throw error;
        }
      };
      
      // Step 5.1: Fetch orders for a specific Finatic account id
      console.log(chalk.yellow('\nStep 5.1: Testing core methods...'));
      try {
        const filteredOrders = await testCore('getAllOrders (filtered)', () => this.client.getAllOrders({
          account_id: ACCOUNT_ID_FILTER,
        }), false);
        console.log(
          chalk.green(
            `✅ Retrieved ${filteredOrders.length} orders for account ${ACCOUNT_ID_FILTER}`
          )
        );
        if (filteredOrders.length > 0) {
          console.log(chalk.gray('Filtered order details:'));
          filteredOrders.slice(0, 3).forEach((order: any, index: number) => {
            console.log(
              chalk.gray(
                `  ${index + 1}. Order ID: ${order.id || 'Unknown'} - Symbol: ${
                  order.symbol || 'Unknown'
                } - Status: ${order.status || 'Unknown'}`
              )
            );
          });
        }
      } catch (error: any) {
        // Error already logged by testCore
      }
      
      // Step 6: Test get_connections immediately after portal auth
      console.log(chalk.yellow('\nStep 6: Testing getBrokerConnections...'));
      let connections: any[] = [];
      try {
        console.log(chalk.gray(`  Session ID: ${this.client.getSessionId() || 'Not set'}`));
        console.log(chalk.gray(`  Company ID: ${this.client.getCompanyId() || 'Not set'}`));
        connections = await testCore('getBrokerConnections', () => this.client.getBrokerConnections(), false);
        console.log(chalk.green(`✅ Successfully retrieved ${connections.length} broker connections`));
        if (connections.length > 0) {
          console.log(chalk.gray('Connection details:'));
          connections.slice(0, 3).forEach((conn: any, index: number) => {
            console.log(chalk.gray(`  ${index + 1}. Broker ID: ${conn.broker_id || 'Unknown'} - Status: ${conn.status || 'Unknown'}`));
          });
        }
      } catch (error: any) {
        // Error already logged by testCore
      }
      
      // Step 7: Test get_accounts
      console.log(chalk.yellow('\nStep 7: Testing getAccounts...'));
      let accountsResult: any;
      try {
        accountsResult = await testCore('getAccounts (paginated)', () => this.client.getAccounts(1, 10), false);
        const hasMore = accountsResult.metadata?.has_more ? ' (has more pages)' : '';
        console.log(chalk.green(`✅ Successfully retrieved ${accountsResult.data.length} accounts${hasMore}`));
        if (accountsResult.data.length > 0) {
          console.log(chalk.gray('Account details:'));
          accountsResult.data.slice(0, 3).forEach((account: any, index: number) => {
            console.log(chalk.gray(`  ${index + 1}. Account: ${account.account_number || account.id || 'Unknown'} - Broker: ${account.broker_id || 'Unknown'}`));
          });
        }
      } catch (error: any) {
        // Error already logged by testCore
      }

      // Step 8: Test get_orders
      console.log(chalk.yellow('\nStep 8: Testing getOrders...'));
      let ordersResult: any;
      try {
        ordersResult = await testCore('getOrders (paginated)', () => this.client.getOrders(1, 10), false);
        const hasMore = ordersResult.metadata?.has_more ? ' (has more pages)' : '';
        console.log(chalk.green(`✅ Successfully retrieved ${ordersResult.data.length} orders${hasMore}`));
        if (ordersResult.data.length > 0) {
          console.log(chalk.gray('Order details:'));
          ordersResult.data.slice(0, 3).forEach((order: any, index: number) => {
            console.log(chalk.gray(`  ${index + 1}. Symbol: ${order.symbol || 'Unknown'} - Status: ${order.status || 'Unknown'} - Quantity: ${order.quantity || order.order_qty || 'Unknown'}`));
          });
        }
      } catch (error: any) {
        // Error already logged by testCore
      }

      // Step 9: Test get_balances
      console.log(chalk.yellow('\nStep 9: Testing getBalances...'));
      try {
        const balancesResult = await testCore('getBalances (paginated)', () => this.client.getBalances(1, 10), false);
        const hasMore = balancesResult.metadata?.has_more ? ' (has more pages)' : '';
        console.log(chalk.green(`✅ Successfully retrieved ${balancesResult.data.length} balances${hasMore}`));
        if (balancesResult.data.length > 0) {
          console.log(chalk.gray('Balance details:'));
          balancesResult.data.slice(0, 3).forEach((balance: any, index: number) => {
            const cashBalance = balance.cash || balance.buying_power || balance.account_value || 'Unknown';
            console.log(chalk.gray(`  ${index + 1}. Account: ${balance.account_number || balance.account_id || 'Unknown'} - Balance: ${cashBalance}`));
          });
        }
      } catch (error: any) {
        // Error already logged by testCore
      }

      // Step 10: Test get_positions
      console.log(chalk.yellow('\nStep 10: Testing getPositions...'));
      try {
        const positionsResult = await testCore('getPositions (paginated)', () => this.client.getPositions(1, 10), false);
        const hasMore = positionsResult.metadata?.has_more ? ' (has more pages)' : '';
        console.log(chalk.green(`✅ Successfully retrieved ${positionsResult.data.length} positions${hasMore}`));
        if (positionsResult.data.length > 0) {
          console.log(chalk.gray('Position details:'));
          positionsResult.data.slice(0, 3).forEach((position: any, index: number) => {
            console.log(chalk.gray(`  ${index + 1}. Symbol: ${position.symbol || 'Unknown'} - Quantity: ${position.quantity || position.qty || 'Unknown'} - Side: ${position.side || 'Unknown'}`));
          });
        }
      } catch (error: any) {
        // Error already logged by testCore
      }

      // Core methods summary
      console.log(chalk.gray(`\n  Core Methods Summary: ${coreResults.passed}/${coreResults.total} passed`));
      if (coreResults.failed > 0) {
        console.log(chalk.yellow(`  ${coreResults.failed} core method(s) failed (see details above)`));
      } else {
        console.log(chalk.green('  ✅ All core methods passed!'));
      }

      // Step 11: Test helper methods
      console.log(chalk.yellow('\nStep 11: Testing helper methods...'));
      const helperResults = {
        passed: 0,
        failed: 0,
        total: 0,
      };

      // Helper to test a method and track results
      const testHelper = async (name: string, fn: () => Promise<any>, expectedType: 'array' | 'object' = 'array'): Promise<void> => {
        helperResults.total++;
        try {
          const result = await fn();
          const isValid = expectedType === 'array' 
            ? Array.isArray(result) 
            : (result && typeof result === 'object');
          
          if (isValid) {
            helperResults.passed++;
            console.log(chalk.gray(`  ✅ ${name}`));
          } else {
            helperResults.failed++;
            console.log(chalk.red(`  ❌ ${name} (invalid return type)`));
          }
        } catch (error: any) {
          helperResults.failed++;
          console.log(chalk.red(`  ❌ ${name} (${error.message?.substring(0, 50) || 'error'})`));
        }
      };

      // Test getAll* methods (fetch all data across pages)
      await testHelper('getAllAccounts', () => this.client.getAllAccounts());
      await testHelper('getAllOrders', () => this.client.getAllOrders());
      await testHelper('getAllPositions', () => this.client.getAllPositions());
      await testHelper('getAllBalances', () => this.client.getAllBalances());

      // Test filtered helper methods (use symbols/statuses from earlier results if available)
      const sampleSymbol = ordersResult?.data?.length > 0 ? ordersResult.data[0].symbol : 'AAPL';
      const sampleBrokerId = connections?.length > 0 ? connections[0].broker_id : undefined;

      await testHelper('getOpenPositions', () => this.client.getOpenPositions());
      await testHelper('getFilledOrders', () => this.client.getFilledOrders());
      await testHelper('getPendingOrders', () => this.client.getPendingOrders());
      await testHelper('getActiveAccounts', () => this.client.getActiveAccounts());
      
      if (sampleSymbol) {
        await testHelper(`getOrdersBySymbol("${sampleSymbol}")`, () => this.client.getOrdersBySymbol(sampleSymbol));
        await testHelper(`getPositionsBySymbol("${sampleSymbol}")`, () => this.client.getPositionsBySymbol(sampleSymbol));
      }
      
      if (sampleBrokerId) {
        await testHelper(`getOrdersByBroker("${sampleBrokerId}")`, () => this.client.getOrdersByBroker(sampleBrokerId));
        await testHelper(`getPositionsByBroker("${sampleBrokerId}")`, () => this.client.getPositionsByBroker(sampleBrokerId));
      }

      // Summary
      console.log(chalk.gray(`\n  Helper Methods Summary: ${helperResults.passed}/${helperResults.total} passed`));
      if (helperResults.failed > 0) {
        console.log(chalk.yellow(`  ${helperResults.failed} helper method(s) failed (see details above)`));
      } else {
        console.log(chalk.green('  ✅ All helper methods passed!'));
      }

      // Step 12: Disconnect the first connection
      if (connections.length > 0) {
        console.log(chalk.yellow('\nStep 12: Disconnecting first connection...'));
        try {
          const firstConnection = connections[0];
          const connectionId = firstConnection.id;
          console.log(chalk.gray(`  Disconnecting connection: ${connectionId}`));
          console.log(chalk.gray(`  Broker: ${firstConnection.broker_id || 'Unknown'}`));
          
          await this.client.brokers.disconnectCompanyFromBroker(connectionId);
          console.log(chalk.green(`✅ Successfully disconnected connection ${connectionId}`));
        } catch (error: any) {
          console.log(chalk.red(`❌ Failed to disconnect connection: ${error.message}`));
          throw error;
        }
      } else {
        console.log(chalk.yellow('\nStep 12: Skipping disconnect - no connections available'));
      }
      
      console.log(chalk.green('\n🎉 Demo completed successfully!'));
      console.log(chalk.gray(`\n📊 Test Summary:`));
      console.log(chalk.gray(`  Core methods: ${coreResults.passed}/${coreResults.total} passed`));
      console.log(chalk.gray(`  Helper methods: ${helperResults.passed}/${helperResults.total} passed`));
      const totalPassed = coreResults.passed + helperResults.passed;
      const totalTests = coreResults.total + helperResults.total;
      if (totalPassed === totalTests) {
        console.log(chalk.green(`  Total: ${totalPassed}/${totalTests} passed ✅`));
      } else {
        console.log(chalk.yellow(`  Total: ${totalPassed}/${totalTests} passed`));
      }
      console.log(chalk.gray('\nYou are now authenticated and can use all SDK methods.'));
      
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error);
      process.exit(1);
    }
  }

}

// Run the demo
if (require.main === module) {
  const demo = new FinaticDemo();
  demo.run().catch(console.error);
}

export default FinaticDemo;
