const fs = require('fs');
const path = require('path');
const { createGasMocks, loadGas } = require('./helpers/gas');

const SRC_DIR = path.join(__dirname, '..', 'src');

describe('ui', () => {
  it('onOpen adds the Job Helper menu', () => {
    const mocks = createGasMocks();
    loadGas(mocks).onOpen();

    expect(mocks.__.ui.createMenu).toHaveBeenCalledWith('Job Helper');
    const menu = mocks.__.ui.createMenu.mock.results[0].value;
    expect(menu.addItem.mock.calls.map(([, fn]) => fn))
      .toEqual(['showSidebar', 'checkApplications', 'generateReports', 'setupTriggers']);
    expect(menu.addToUi).toHaveBeenCalled();
  });

  it('every menu and sidebar action refers to an existing server function', () => {
    const mocks = createGasMocks();
    const gas = loadGas(mocks);
    gas.createCustomMenu();
    const menuFunctions = mocks.__.ui.createMenu.mock.results[0].value.addItem.mock.calls.map(([, fn]) => fn);
    const clientJs = fs.readFileSync(path.join(SRC_DIR, 'html', 'client-js.html'), 'utf8');
    const sidebarFunctions = [...clientJs.matchAll(/\.withFailureHandler\(onFailure\)\s*\.(\w+)\(/g)].map(m => m[1]);

    expect(sidebarFunctions.length).toBeGreaterThan(0);
    [...menuFunctions, ...sidebarFunctions].forEach(fn => expect(typeof gas[fn]).toBe('function'));
  });

  it('showSidebar renders the sidebar template', () => {
    const mocks = createGasMocks();
    loadGas(mocks).showSidebar();
    expect(mocks.HtmlService.createTemplateFromFile).toHaveBeenCalledWith('html/sidebar');
    expect(mocks.__.ui.showSidebar).toHaveBeenCalled();
  });

  it('the sidebar includes files by their project path', () => {
    const sidebar = fs.readFileSync(path.join(SRC_DIR, 'html', 'sidebar.html'), 'utf8');
    const includes = [...sidebar.matchAll(/include\('([^']+)'\)/g)].map(m => m[1]);

    expect(includes).toEqual(['html/stylesheet', 'html/client-js']);
    includes.forEach(name => expect(fs.existsSync(path.join(SRC_DIR, `${name}.html`))).toBe(true));
  });

  it('the client script does not use google.script.host APIs that do not exist', () => {
    const clientJs = fs.readFileSync(path.join(SRC_DIR, 'html', 'client-js.html'), 'utf8');
    expect(clientJs).not.toMatch(/google\.script\.host\.(showNotification|showAlert)/);
  });
});
