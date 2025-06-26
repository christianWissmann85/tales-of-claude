import { ReportsAPI } from './lib/reports-api.js';
import fs from 'fs';

// Tamy's Field Reports Test Suite
console.log('🔧 FIELD REPORTS MCP TEST SUITE 🔧\n');

// Create fresh test database
const testDb = 'test-reports.db';
if (fs.existsSync(testDb)) {
    fs.unlinkSync(testDb);
}

const reports = new ReportsAPI(testDb);

async function runTests() {
    let passed = 0;
    let failed = 0;

    // Test 1: Save Report
    console.log('1. Testing saveReport...');
    try {
        const result = await reports.saveReport({
            agentName: 'tamy-tester',
            title: 'Testing Field Reports Tool',
            content: 'This is a test report to verify the field reports MCP tool is working correctly.',
            mission: 'test-mcp-tools',
            status: 'success',
            category: 'feature',
            tags: 'test,mcp,validation',
            metrics: {
                tests_run: 1,
                coverage: 100
            }
        });
        
        if (result.success && result.reportId) {
            console.log(`✓ PASS: Report saved with ID ${result.reportId}`);
            passed++;
        } else {
            console.log('✗ FAIL: Report save returned unexpected result');
            failed++;
        }
    } catch (error) {
        console.log('✗ FAIL: Could not save report:', error.message);
        failed++;
    }

    // Test 2: Recall Reports
    console.log('\n2. Testing recallReports...');
    try {
        const result = await reports.recallReports({
            mission: 'test-mcp-tools'
        });
        
        if (result.reports && result.reports.length === 1) {
            console.log(`✓ PASS: Retrieved ${result.reports.length} report(s)`);
            passed++;
        } else {
            console.log('✗ FAIL: Did not retrieve expected reports');
            failed++;
        }
    } catch (error) {
        console.log('✗ FAIL: Could not recall reports:', error.message);
        failed++;
    }

    // Test 3: Search Reports
    console.log('\n3. Testing searchReports...');
    try {
        // Add more reports for searching
        await reports.saveReport({
            agentName: 'annie-lead',
            title: 'Bug Found in Testing',
            content: 'Found an issue during testing. Error occurred in module X.',
            mission: 'test-mcp-tools',
            status: 'error',
            category: 'bug'
        });
        
        await reports.saveReport({
            agentName: 'clara-coder',
            title: 'Feature Complete',
            content: 'Successfully implemented new feature. All tests passing.',
            mission: 'test-mcp-tools',
            status: 'success',
            category: 'feature'
        });
        
        const searchResult = await reports.searchReports({
            query: 'testing',
            mission: 'test-mcp-tools'
        });
        
        if (searchResult.results && searchResult.results.length > 0) {
            console.log(`✓ PASS: Search found ${searchResult.results.length} results`);
            passed++;
        } else {
            console.log('✗ FAIL: Search returned no results');
            failed++;
        }
    } catch (error) {
        console.log('✗ FAIL: Could not search reports:', error.message);
        failed++;
    }

    // Test 4: Analyze Patterns
    console.log('\n4. Testing analyzePatterns...');
    try {
        const analysis = await reports.analyzePatterns({
            mission: 'test-mcp-tools'
        });
        
        if (analysis.patterns) {
            console.log('✓ PASS: Pattern analysis completed');
            console.log(`  - Patterns found: ${analysis.patterns.length}`);
            passed++;
        } else {
            console.log('✗ FAIL: Pattern analysis failed');
            failed++;
        }
    } catch (error) {
        console.log('✗ FAIL: Could not analyze patterns:', error.message);
        failed++;
    }

    // Test 5: Bulk Export
    console.log('\n5. Testing bulkExport...');
    try {
        const exportResult = await reports.bulkExport({
            format: 'csv',
            mission: 'test-mcp-tools'
        });
        
        if (exportResult.data) {
            console.log('✓ PASS: Bulk export generated');
            console.log(`  - Export size: ${exportResult.data.length} chars`);
            passed++;
        } else {
            console.log('✗ FAIL: Bulk export failed');
            failed++;
        }
    } catch (error) {
        console.log('✗ FAIL: Could not export data:', error.message);
        failed++;
    }

    // Test 6: Edge Cases
    console.log('\n6. Testing edge cases...');
    
    // Empty content
    try {
        await reports.saveReport({
            agentName: 'edge-tester',
            title: 'Empty Report',
            content: '',
            mission: 'edge-test'
        });
        console.log('✗ FAIL: Should reject empty content');
        failed++;
    } catch (error) {
        console.log('✓ PASS: Correctly rejected empty content');
        passed++;
    }
    
    // Missing required fields
    try {
        await reports.saveReport({
            agentName: 'edge-tester',
            title: 'Missing Mission',
            content: 'Testing missing fields'
            // mission is missing
        });
        console.log('✗ FAIL: Should reject missing mission');
        failed++;
    } catch (error) {
        console.log('✓ PASS: Correctly rejected missing mission');
        passed++;
    }
    
    // Non-existent mission
    try {
        const result = await reports.recallReports({
            mission: 'non-existent-mission-xyz-123'
        });
        if (result.reports.length === 0) {
            console.log('✓ PASS: Handled non-existent mission');
            passed++;
        } else {
            console.log('✗ FAIL: Returned data for non-existent mission');
            failed++;
        }
    } catch (error) {
        console.log('✗ FAIL: Error on non-existent mission:', error.message);
        failed++;
    }

    // Test 7: Bundle Generation
    console.log('\n7. Testing generateBundle...');
    try {
        // Create session with multiple related reports
        const bundleMission = 'bundle-test-001';
        
        for (let i = 0; i < 5; i++) {
            await reports.saveReport({
                agentName: `agent-${i}`,
                title: `Bundle Test Report ${i}`,
                content: `This is report ${i} for bundle testing. Contains important information about feature X.`,
                mission: bundleMission,
                status: 'success',
                category: 'feature',
                metrics: {
                    tokens_saved: 100 * i,
                    performance: 95 + i
                }
            });
        }
        
        const bundle = await reports.generateBundle({
            mission: bundleMission,
            sections: ['summary', 'timeline', 'metrics']
        });
        
        if (bundle.content && bundle.metadata) {
            console.log('✓ PASS: Bundle generated successfully');
            console.log(`  - Bundle size: ${bundle.content.length} chars`);
            console.log(`  - Report count: ${bundle.metadata.reportCount}`);
            passed++;
        } else {
            console.log('✗ FAIL: Bundle generation failed');
            failed++;
        }
    } catch (error) {
        console.log('✗ FAIL: Could not generate bundle:', error.message);
        failed++;
    }

    // Test 8: Get Metrics
    console.log('\n8. Testing getMetrics...');
    try {
        const metrics = await reports.getMetrics({
            mission: 'bundle-test-001'
        });
        
        if (metrics.summary && metrics.byAgent) {
            console.log('✓ PASS: Metrics retrieved successfully');
            console.log(`  - Total tokens saved: ${metrics.summary.totalTokensSaved || 0}`);
            passed++;
        } else {
            console.log('✗ FAIL: Metrics retrieval failed');
            failed++;
        }
    } catch (error) {
        console.log('✗ FAIL: Could not get metrics:', error.message);
        failed++;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`FIELD REPORTS TEST RESULTS:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
    console.log('='.repeat(50));

    // Cleanup
    fs.unlinkSync(testDb);
}

runTests().catch(console.error);