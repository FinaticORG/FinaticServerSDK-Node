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
import { FinaticServerClient } from '@finatic/server-node';
import inquirer from 'inquirer';
import chalk from 'chalk';

// Configuration
const API_URL = process.env.FINATIC_API_URL || 'https://api.finatic.dev';
const API_KEY = process.env.FINATIC_API_KEY;
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@finatic.com';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'demo_password_123';

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
  private client: FinaticServerClient;

  constructor() {
    // Initialize client like Python SDK - only API key required
    // baseUrl is optional and defaults to https://api.finatic.dev
    // For localhost testing, pass the API_URL as second parameter
    this.client = new FinaticServerClient(apiKey, API_URL);
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
      console.log(chalk.green('✅ SDK initialized successfully'));
      
      // Step 2: Start session
      console.log(chalk.yellow('\nStep 2: Starting session...'));
      try {
        const sessionResponse = await this.client.start_session();
        const sessionId = sessionResponse.session_id || sessionResponse.data?.session_id || this.client.get_session_id();
        console.log(chalk.green(`✅ Session started: ${sessionId}`));
        
        // Step 3: Get portal URL
        console.log(chalk.yellow('\nStep 3: Getting portal URL...'));
        const portalUrl = await this.client.get_portal_url();
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
      const userInfo = await this.client.get_session_user();
      console.log(chalk.green('✅ User authenticated successfully!'));
      console.log(chalk.gray(`User ID: ${userInfo.user_id}`));
      console.log(chalk.gray(`Company ID: ${userInfo.company_id}`));
      console.log(chalk.gray(`Token Type: ${userInfo.token_type}`));
      
      // Step 6: Now we can use data methods
      console.log(chalk.yellow('\nStep 6: Testing data methods...'));
      await this.testDataMethods();
      
      console.log(chalk.green('\n🎉 Demo completed successfully!'));
      console.log(chalk.gray('\nYou are now authenticated and can use all SDK methods.'));
      
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error);
      process.exit(1);
    }
  }

  async testDataMethods() {
    console.log(chalk.blue('\n📊 Testing Data Methods\n'));

    try {
      // Test 1: Get broker list
      console.log('1. Getting available brokers...');
      const brokers = await this.client.get_brokers();
      console.log(chalk.green(`✅ Found ${brokers.length} brokers`));
      
      if (brokers.length > 0) {
        console.log(chalk.gray('Available brokers:'));
        brokers.slice(0, 3).forEach((broker: any, index: number) => {
          console.log(chalk.gray(`  ${index + 1}. ${broker.display_name} (${broker.id})`));
        });
      }

      // Test 2: Get broker accounts
      console.log('\n2. Getting broker accounts...');
      const accounts = await this.client.get_all_accounts();
      console.log(chalk.green(`✅ Found ${accounts.length} accounts`));
      
      if (accounts.length > 0) {
        console.log(chalk.gray('Account details:'));
        accounts.slice(0, 2).forEach((account: any, index: number) => {
          console.log(chalk.gray(`  ${index + 1}. ${account.account_name} - ${account.broker_provided_account_id}`));
          console.log(chalk.gray(`     Type: ${account.account_type}, Status: ${account.status}`));
        });
      }

      // Test 3: Get orders
      console.log('\n3. Getting orders...');
      const orders = await this.client.get_orders();
      console.log(chalk.green(`✅ Found ${orders?.data?.length || 0} orders`));

      // Test 4: Get positions
      console.log('\n4. Getting positions...');
      const positions = await this.client.get_positions();
      console.log(chalk.green(`✅ Found ${positions?.data?.length || 0} positions`));

      // Test 5: Get balances
      console.log('\n5. Getting balances...');
      const balancesResult = await this.client.get_balances();
      const balances = balancesResult.data || [];
      console.log(chalk.green(`✅ Found ${balances.length} balances`));
      
      if (balances.length > 0) {
        console.log(chalk.gray('Balance details:'));
        balances.slice(0, 3).forEach((balance: any, index: number) => {
          console.log(chalk.gray(`  ${index + 1}. Account ${balance.account_id}`));
          console.log(chalk.gray(`     Net Liquidation: $${balance.net_liquidation_value?.toLocaleString() || 'N/A'}`));
          console.log(chalk.gray(`     Total Cash: $${balance.total_cash_value?.toLocaleString() || 'N/A'}`));
        });
      }

      // Test 6: Get broker connections
      console.log('\n6. Getting broker connections...');
      const connections = await this.client.get_connections();
      console.log(chalk.green(`✅ Found ${connections.length} connections`));

      console.log(chalk.green('\n✅ All data methods tested successfully!'));
      console.log(chalk.gray('\nYou can now use all SDK methods for trading, portfolio management, and broker operations.'));

    } catch (error) {
      console.log(chalk.red('❌ Data methods test failed:'), error);
    }
  }
}

// Run the demo
if (require.main === module) {
  const demo = new FinaticDemo();
  demo.run().catch(console.error);
}

export default FinaticDemo;
