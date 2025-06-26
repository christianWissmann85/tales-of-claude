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
            sessionName: 'test-session-001',
            agentName: 'tamy-tester',
            reportType: 'feature',
            title: 'Testing Field Reports Tool',
            content: 'This is a test report to verify the field reports MCP tool is working correctly.',
            metadata: {
                testId: 'test-001',
                environment: 'test',
                custom: 'data'
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

    // Test 2: Get Reports
    console.log('\n2. Testing getReports...');
    try {
        const result = await reports.getReports({
            sessionName: 'test-session-001'
        });
        
        if (result.reports && result.reports.length === 1) {
            console.log(`✓ PASS: Retrieved ${result.reports.length} report(s)`);
            passed++;
        } else {
            console.log('✗ FAIL: Did not retrieve expected reports');
            failed++;
        }
    } catch (error) {
        console.log('✗ FAIL: Could not get reports:', error.message);
        failed++;
    }

    // Test 3: Analyze Session
    console.log('\n3. Testing analyzeSession...');
    try {
        // Add more reports for analysis
        await reports.saveReport({
            sessionName: 'test-session-001',
            agentName: 'annie-lead',
            reportType: 'bug',
            title: 'Bug Found in Testing',
            content: 'Found an issue during testing. Error occurred in module X.'
        });
        
        await reports.saveReport({
            sessionName: 'test-session-001',
            agentName: 'clara-coder',
            reportType: 'feature',
            title: 'Feature Complete',
            content: 'Successfully implemented new feature. All tests passing.'
        });
        
        const analysis = await reports.analyzeSession({
            sessionName: 'test-session-001'
        });
        
        if (analysis.insights && analysis.stats) {
            console.log('✓ PASS: Session analysis generated');
            console.log(`  - Total reports: ${analysis.stats.totalReports}`);
            console.log(`  - Active agents: ${analysis.stats.activeAgents}`);
            passed++;
        } else {
            console.log('✗ FAIL: Analysis missing expected data');
            failed++;
        }
    } catch (error) {
        console.log('✗ FAIL: Could not analyze session:', error.message);
        failed++;
    }

    // Test 4: Export to CSV
    console.log('\n4. Testing exportToCSV...');
    try {
        const result = await reports.exportToCSV({
            sessionName: 'test-session-001'
        });
        
        if (result.csv && result.csv.includes('sessionName,agentName')) {
            console.log('✓ PASS: CSV export generated');
            console.log(`  - CSV length: ${result.csv.length} chars`);
            passed++;
        } else {
            console.log('✗ FAIL: CSV export invalid');
            failed++;
        }
    } catch (error) {
        console.log('✗ FAIL: Could not export CSV:', error.message);
        failed++;
    }

    // Test 5: Edge Cases
    console.log('\n5. Testing edge cases...');
    
    // Empty content
    try {
        await reports.saveReport({
            sessionName: 'edge-test',
            agentName: 'edge-tester',
            reportType: 'test',
            title: 'Empty Report',
            content: ''
        });
        console.log('✗ FAIL: Should reject empty content');
        failed++;
    } catch (error) {
        console.log('✓ PASS: Correctly rejected empty content');
        passed++;
    }
    
    // Invalid report type
    try {
        await reports.saveReport({
            sessionName: 'edge-test',
            agentName: 'edge-tester',
            reportType: 'invalid-type',
            title: 'Invalid Type',
            content: 'Testing invalid type'
        });
        console.log('✗ FAIL: Should reject invalid report type');
        failed++;
    } catch (error) {
        console.log('✓ PASS: Correctly rejected invalid report type');
        passed++;
    }
    
    // Non-existent session
    try {
        const result = await reports.getReports({
            sessionName: 'non-existent-session-xyz-123'
        });
        if (result.reports.length === 0) {
            console.log('✓ PASS: Handled non-existent session');
            passed++;
        } else {
            console.log('✗ FAIL: Returned data for non-existent session');
            failed++;
        }
    } catch (error) {
        console.log('✗ FAIL: Error on non-existent session:', error.message);
        failed++;
    }

    // Test 6: Pattern Analysis
    console.log('\n6. Testing pattern detection...');
    try {
        // Create session with patterns
        const patternSession = 'pattern-test-001';
        
        // Add reports with patterns
        for (let i = 0; i < 5; i++) {
            await reports.saveReport({
                sessionName: patternSession,
                agentName: `agent-${i}`,
                reportType: 'bug',
                title: `Bug in module X iteration ${i}`,
                content: `Found TypeError in function handleClick. Stack trace shows issue in line 42.`
            });
        }
        
        const analysis = await reports.analyzeSession({
            sessionName: patternSession
        });
        
        if (analysis.insights.patterns && analysis.insights.patterns.length > 0) {
            console.log('✓ PASS: Pattern detection working');
            console.log(`  - Patterns found: ${analysis.insights.patterns.length}`);
            passed++;
        } else {
            console.log('✗ FAIL: No patterns detected');
            failed++;
        }
    } catch (error) {
        console.log('✗ FAIL: Pattern analysis failed:', error.message);
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