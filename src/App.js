import logo from './logo.svg';
import './App.css';

function App(props) {
  const { dataURL } = props;
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
       
      </header>
      <img src={dataURL} width={512} height={512} />
    </div>
  );
}

export default App;
