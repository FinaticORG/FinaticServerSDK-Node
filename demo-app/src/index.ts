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

// Feature flags
const ENABLE_DISCONNECT = process.env.ENABLE_DISCONNECT === 'true';

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

      // Step 2: Initialize session (combined method)
      console.log(chalk.yellow('\nStep 2: Initializing session...'));
      try {
        // Use startSession method that handles everything
        const sessionResult = await this.client.startSession();
        
        // Handle union return type: can be { success, session_id, company_id, error } or { session_id, company_id }
        if ('success' in sessionResult && !sessionResult.success) {
          console.log(chalk.red(`❌ Failed to initialize session: ${sessionResult.error}`));
          return;
        }
        
        const sessionId = sessionResult.session_id || this.client.getSessionId();
        const companyId = sessionResult.company_id;
        console.log(chalk.green(`✅ Session initialized successfully`));
        console.log(chalk.gray(`Session ID: ${sessionId}`));
        console.log(chalk.gray(`Company ID: ${companyId}`));
        
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

      // Test session/auth methods
      console.log(chalk.yellow('\nStep 5.1: Testing session/auth methods...'));
      const sessionResults = {
        passed: 0,
        failed: 0,
        total: 0,
      };

      const testSession = async (name: string, fn: () => any | Promise<any>, expectedType: 'string' | 'object' = 'object'): Promise<void> => {
        sessionResults.total++;
        try {
          const result = await (fn() instanceof Promise ? fn() : Promise.resolve(fn()));
          const isValid = expectedType === 'string' 
            ? typeof result === 'string'
            : (result && typeof result === 'object');
          
          if (isValid) {
            sessionResults.passed++;
            console.log(chalk.gray(`  ✅ ${name}`));
          } else {
            sessionResults.failed++;
            console.log(chalk.red(`  ❌ ${name} (invalid return type)`));
          }
        } catch (error: any) {
          sessionResults.failed++;
          console.log(chalk.red(`  ❌ ${name} (${error.message?.substring(0, 50) || 'error'})`));
        }
      };

      await testSession('getSessionId', () => this.client.getSessionId(), 'string');
      await testSession('getCompanyId', () => this.client.getCompanyId(), 'string');
      await testSession('getUserId', () => this.client.getUserId(), 'string');
      await testSession('getPortalUrl', () => this.client.getPortalUrl(), 'string');
      
      console.log(chalk.gray(`\n  Session Methods Summary: ${sessionResults.passed}/${sessionResults.total} passed`));
      
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
      
      // Helper to extract data from FinaticResponse
      const extractData = <T>(response: any): T => {
        if (response?.success?.data !== undefined) {
          return response.success.data as T;
        }
        // Fallback for direct data (backward compatibility)
        return response as T;
      };
      
      // Step 5.1: Fetch orders for a specific Finatic account id
      console.log(chalk.yellow('\nStep 5.1: Testing core methods...'));
      try {
        const filteredOrdersResponse = await testCore('getAllOrders (filtered)', () => this.client.getAllOrders({
          accountId: ACCOUNT_ID_FILTER
        }), false);
        const filteredOrders = extractData<any[]>(filteredOrdersResponse);
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
        const connectionsResponse = await testCore('getBrokerConnections', () => this.client.getBrokerConnections(), false);
        connections = extractData<any[]>(connectionsResponse);
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
      console.log(chalk.yellow('\nStep 7: Testing getAllAccounts...'));
      let accountsResult: any[] = [];
      try {
        const accountsResponse = await testCore('getAllAccounts', () => this.client.getAllAccounts(), false);
        accountsResult = extractData<any[]>(accountsResponse);
        console.log(chalk.green(`✅ Successfully retrieved ${accountsResult.length} accounts`));
        if (accountsResult.length > 0) {
          // Show full response structure for first account
          const firstAccount = accountsResult[0];
          console.log(chalk.gray(`First account structure (keys): ${Object.keys(firstAccount).join(', ')}`));
          console.log(chalk.gray('First account (full JSON):'));
          console.log(chalk.dim(JSON.stringify(firstAccount, null, 2)));
          
          console.log(chalk.gray('Account details:'));
          accountsResult.slice(0, 3).forEach((account: any, index: number) => {
            console.log(chalk.gray(`  ${index + 1}. Account: ${account.account_number || account.accountId || account.id || 'Unknown'} - Broker: ${account.broker_id || account.brokerId || 'Unknown'}`));
          });
        }
      } catch (error: any) {
        // Error already logged by testCore
      }

      // Step 8: Test get_orders
      console.log(chalk.yellow('\nStep 8: Testing getAllOrders...'));
      let ordersResult: any[] = [];
      try {
        const ordersResponse = await testCore('getAllOrders', () => this.client.getAllOrders(), false);
        ordersResult = extractData<any[]>(ordersResponse);
        console.log(chalk.green(`✅ Successfully retrieved ${ordersResult.length} orders`));
        if (ordersResult.length > 0) {
          // Show full response structure for first order
          const firstOrder = ordersResult[0];
          console.log(chalk.gray(`First order structure (keys): ${Object.keys(firstOrder).join(', ')}`));
          console.log(chalk.gray('First order (full JSON):'));
          console.log(chalk.dim(JSON.stringify(firstOrder, null, 2)));
          
          console.log(chalk.gray('Order details:'));
          ordersResult.slice(0, 3).forEach((order: any, index: number) => {
            // Extract symbol from legs[0].securityId if available
            let symbol = 'Unknown';
            if (order.legs && Array.isArray(order.legs) && order.legs.length > 0) {
              symbol = order.legs[0].securityId || order.legs[0].security_id || 'Unknown';
            } else {
              symbol = order.symbol || order.securityId || 'Unknown';
            }
            
            // Extract status
            let status = 'Unknown';
            if (order.status) {
              status = typeof order.status === 'object' && order.status.actual_instance 
                ? order.status.actual_instance 
                : order.status;
            }
            
            // Extract quantity from legs[0] if available
            let quantity = 'Unknown';
            if (order.legs && Array.isArray(order.legs) && order.legs.length > 0) {
              const qtyVal = order.legs[0].quantity;
              quantity = typeof qtyVal === 'object' && qtyVal && qtyVal.actual_instance 
                ? qtyVal.actual_instance 
                : qtyVal || 'Unknown';
            } else {
              quantity = order.quantity || order.order_qty || 'Unknown';
            }
            
            console.log(chalk.gray(`  ${index + 1}. Symbol: ${symbol} - Status: ${status} - Quantity: ${quantity}`));
          });
        }
      } catch (error: any) {
        // Error already logged by testCore
      }

      // Step 9: Test get_balances
      console.log(chalk.yellow('\nStep 9: Testing getAllBalances...'));
      let balancesResult: any[] = [];
      try {
        const balancesResponse = await testCore('getAllBalances', () => this.client.getAllBalances(), false);
        balancesResult = extractData<any[]>(balancesResponse);
        console.log(chalk.green(`✅ Successfully retrieved ${balancesResult.length} balances`));
        if (balancesResult.length > 0) {
          // Show full response structure for first balance
          const firstBalance = balancesResult[0];
          console.log(chalk.gray(`First balance structure (keys): ${Object.keys(firstBalance).join(', ')}`));
          console.log(chalk.gray('First balance (full JSON):'));
          console.log(chalk.dim(JSON.stringify(firstBalance, null, 2)));
          
          console.log(chalk.gray('Balance details:'));
          balancesResult.slice(0, 3).forEach((balance: any, index: number) => {
            const cashBalance = balance.currentBalance || balance.current_balance || balance.cashBalance || balance.cash_balance || balance.cash || balance.buying_power || balance.account_value || 'Unknown';
            const accountId = balance.accountId || balance.account_id || balance.account_number || 'Unknown';
            console.log(chalk.gray(`  ${index + 1}. Account: ${accountId} - Balance: ${cashBalance}`));
          });
        }
      } catch (error: any) {
        // Error already logged by testCore
      }

      // Step 10: Test get_positions
      console.log(chalk.yellow('\nStep 10: Testing getAllPositions...'));
      let positionsResult: any[] = [];
      try {
        const positionsResponse = await testCore('getAllPositions', () => this.client.getAllPositions(), false);
        positionsResult = extractData<any[]>(positionsResponse);
        console.log(chalk.green(`✅ Successfully retrieved ${positionsResult.length} positions`));
        if (positionsResult.length > 0) {
          // Show full response structure for first position
          const firstPosition = positionsResult[0];
          console.log(chalk.gray(`First position structure (keys): ${Object.keys(firstPosition).join(', ')}`));
          console.log(chalk.gray('First position (full JSON):'));
          console.log(chalk.dim(JSON.stringify(firstPosition, null, 2)));
          
          console.log(chalk.gray('Position details:'));
          positionsResult.slice(0, 3).forEach((position: any, index: number) => {
            const symbol = position.securityId || position.security_id || position.symbol || 'Unknown';
            
            // Extract quantity (may be union type)
            let quantity = 'Unknown';
            const qtyVal = position.quantity || position.qty;
            quantity = typeof qtyVal === 'object' && qtyVal && qtyVal.actual_instance 
              ? qtyVal.actual_instance 
              : qtyVal || 'Unknown';
            
            // Extract side (may be union type)
            let side = 'Unknown';
            const sideVal = position.side;
            side = typeof sideVal === 'object' && sideVal && sideVal.actual_instance 
              ? sideVal.actual_instance 
              : sideVal || 'Unknown';
            
            console.log(chalk.gray(`  ${index + 1}. Symbol: ${symbol} - Quantity: ${quantity} - Side: ${side}`));
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
          const response = await fn();
          // Extract data from FinaticResponse if present
          const result = extractData(response);
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

      // Test broker list
      await testHelper('getBrokers', () => this.client.getBrokers());

      // Test getAll* methods (fetch all data across pages)
      // These return FinaticResponse<...[]>, testHelper will extract data
      await testHelper('getAllAccounts', () => this.client.getAllAccounts());
      await testHelper('getAllOrders', () => this.client.getAllOrders());
      await testHelper('getAllPositions', () => this.client.getAllPositions());
      await testHelper('getAllBalances', () => this.client.getAllBalances());
      await testHelper('getAllOrderGroups', () => this.client.getAllOrderGroups());

      // Test order/position detail methods (require IDs from earlier results)
      if (ordersResult.length > 0) {
        const sampleOrderId = ordersResult[0].id || ordersResult[0].order_id;
        if (sampleOrderId) {
          await testHelper(
            `getAllOrderFills("${sampleOrderId}")`,
            () => this.client.getAllOrderFills({ orderId: sampleOrderId }),
            'array'
          );
          await testHelper(
            `getAllOrderEvents("${sampleOrderId}")`,
            () => this.client.getAllOrderEvents({ orderId: sampleOrderId }),
            'array'
          );
        }
      }

      // Test getAllPositionLots
      let allPositionLotsResult: any[] = [];
      try {
        const allPositionLotsResponse = await this.client.getAllPositionLots();
        allPositionLotsResult = extractData<any[]>(allPositionLotsResponse);
      } catch (error: any) {
        // Error will be logged by testHelper below
      }
      await testHelper('getAllPositionLots', () => this.client.getAllPositionLots());

      // Test getPositionLotFills (use allPositionLotsResult if available)
      if (allPositionLotsResult.length > 0) {
        const sampleLotId =
          allPositionLotsResult[0].id ||
          allPositionLotsResult[0].lot_id ||
          allPositionLotsResult[0].position_lot_id;
        if (sampleLotId) {
          await testHelper(
            `getAllPositionLotFills("${sampleLotId}")`,
            () => this.client.getAllPositionLotFills({ lotId: sampleLotId }),
            'array'
          );
        }
      }

      // Note: disconnectCompany is not available in server SDK (portal-only)

      // Summary
      console.log(chalk.gray(`\n  Helper Methods Summary: ${helperResults.passed}/${helperResults.total} passed`));
      if (helperResults.failed > 0) {
        console.log(chalk.yellow(`  ${helperResults.failed} helper method(s) failed (see details above)`));
      } else {
        console.log(chalk.green('  ✅ All helper methods passed!'));
      }

      console.log(chalk.green('\n🎉 Demo completed successfully!'));
      console.log(chalk.gray(`\n📊 Test Summary:`));
      console.log(chalk.gray(`  Session methods: ${sessionResults.passed}/${sessionResults.total} passed`));
      console.log(chalk.gray(`  Core methods: ${coreResults.passed}/${coreResults.total} passed`));
      console.log(chalk.gray(`  Helper methods: ${helperResults.passed}/${helperResults.total} passed`));
      const totalPassed = sessionResults.passed + coreResults.passed + helperResults.passed;
      const totalTests = sessionResults.total + coreResults.total + helperResults.total;
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
