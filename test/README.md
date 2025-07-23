# DxT Test Suite Documentation

## Overview
This comprehensive test suite validates all major functionality of the DxT dataflow design application.

## Test Files

### 1. `validation-test.js`
**Purpose:** Tests the JSON schema validation system
**Coverage:**
- Valid diagram validation
- Invalid diagram detection
- Valid palette validation 
- Invalid palette detection
- Error message formatting

### 2. `app-functionality.test.js`
**Purpose:** Tests core application functionality
**Coverage:**
- **Node Management** (4 tests)
  - Node creation with properties
  - Port configuration validation
  - Position updates
  - Property preservation
  
- **Wire Management** (3 tests)
  - Wire connection creation
  - Duplicate input prevention
  - Wire removal on node deletion
  
- **Custom Node Definitions** (3 tests)
  - Custom node type creation
  - Definition validation
  - Built-in type preservation
  
- **Selection Management** (4 tests)
  - Single node selection
  - Multi-node selection
  - Selection clearing
  - Lasso selection area calculation
  
- **Copy/Paste Functionality** (3 tests)
  - Clipboard operations
  - Node offset on paste
  - Wire preservation between copied nodes
  
- **File Format** (3 tests)
  - Save data structure validation
  - File name sanitization
  - JSON serialization/deserialization
  
- **Node Deletion** (2 tests)
  - Node removal
  - Connected wire cleanup
  
- **Canvas Interaction** (2 tests)
  - Drop zone validation
  - Context menu positioning
  
- **Property Editor** (2 tests)
  - Data binding
  - Property merging
  
- **Validation Integration** (2 tests)
  - Valid data loading
  - Invalid data rejection

### 3. `run-tests.js`
**Purpose:** Test runner script that executes all test suites
**Features:**
- Sequential test execution
- Clear output formatting
- Success/failure reporting
- Exit code handling

## How to Run Tests

### Run All Tests
```bash
cd src
npm test
```

### Run Specific Test Suites
```bash
# Validation tests only
npm run test:validation

# App functionality tests only
npm run test:app
```

### Direct Execution
```bash
# From project root
node test/validation-test.js
node test/app-functionality.test.js
node test/run-tests.js
```

## Test Results
- **Total Tests:** 32 (4 validation + 28 functionality)
- **Success Rate:** 100%
- **Coverage:** All major application features

## Test Methodology
- **Unit Testing:** Individual function and feature validation
- **Integration Testing:** Cross-component interaction validation
- **Data Validation:** Input/output format verification
- **Error Handling:** Invalid data and edge case testing

## Benefits
✅ **Regression Prevention** - Catch breaking changes early
✅ **Feature Validation** - Ensure all functionality works correctly
✅ **Data Integrity** - Validate file formats and data structures
✅ **Quality Assurance** - Maintain code quality standards
✅ **Documentation** - Tests serve as living documentation

## Future Enhancements
- Add performance benchmarking tests
- Include UI automation tests
- Add memory leak detection
- Implement code coverage reporting
- Add end-to-end workflow testing

## Notes
- Tests use mock data to simulate application state
- No external dependencies required
- All tests run in Node.js environment
- Tests are designed to be fast and reliable
- Clear pass/fail indicators with detailed output
