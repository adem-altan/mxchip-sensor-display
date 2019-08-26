import React, { Component } from 'react';
import './App.css';
import { ServiceBusClient, ReceiveMode } from '@azure/service-bus';

const connectionString = process.env.REACT_APP_CONNECTION_STRING;
const queueName = process.env.REACT_APP_QUEUE_NAME;
const timeInterval = 10;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deviceStatus: 'Offline',
      seconds: timeInterval,
      lastSeen: 'N/A',
      current: {
        temperature: null,
        humidity: null,
        pressure: null,
      },
      lowest: {
        temperature: null,
        humidity: null,
        pressure: null,
      },
      highest: {
        temperature: null,
        humidity: null,
        pressure: null,
      }
    }
  }
  tick() {
    if(this.state.seconds !== 0)
    {
      this.setState(prevState => ({
        seconds: prevState.seconds - 1
      }));
    } else {
      this.accessSensorReadings();
      this.setState({ seconds: timeInterval});
    }
    
  }

  componentDidMount() {
    this.interval = setInterval(() => this.tick(), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }
  
  async  accessSensorReadings(){
    const sbClient = ServiceBusClient.createFromConnectionString(connectionString); 
    const queueClient = sbClient.createQueueClient(queueName);
    const receiver = queueClient.createReceiver(ReceiveMode.ReceiveAndDelete);
    try {
      const messages = await receiver.receiveMessages(1)
      console.log("Received messages:");
      if(messages.length != 0) 
      {
        messages.map(message =>
          this.setState({
            ...this.state,
            deviceStatus: 'Online',
            lastSeen: this.getDate(),
            current: {
              temperature: message.body.current_temperature,
              humidity: message.body.humidity_level,
              pressure: message.body.pressure
            },
            lowest: {
              temperature: this.getLowestTemperature(message),
              humidity: this.getLowestHumidity(message),
              pressure: this.getLowestPressure(message),
            },
            highest: {
              temperature: this.getHighestTemperature(message),
              humidity: this.getHighestHumidity(message),
              pressure: this.getHighestPressure(message),
            }
          }))
      } else {
        this.setState({
          deviceStatus: 'Offline',
          current: {
            temperature: 'N/A',
            humidity: 'N/A',
            pressure: 'N/A'
          }
        })
      }
      console.log(messages.map(message => message.body));
      await queueClient.close();
    } finally {
      await sbClient.close();
    }
  }
  getDate()
  {
    let currentDateTime = new Date();
    console.log(currentDateTime);
    return currentDateTime;
  }
  getLowestTemperature(message)
  {
    if(message.body.current_temperature < this.state.lowest.temperature || this.state.lowest.temperature === null)
    {
      return message.body.current_temperature;
    } 
    return this.state.lowest.temperature;
  }
  getLowestHumidity(message)
  {
    if(message.body.humidity_level < this.state.lowest.humidity || this.state.lowest.humidity === null)
    {
      return message.body.humidity_level;
    } 
    return this.state.lowest.humidity;
  }
  getLowestPressure(message)
  {
    if(message.body.pressure < this.state.lowest.pressure || this.state.lowest.pressure === null)
    {
      return message.body.pressure;
    } 
    return this.state.lowest.pressure;
  }
  getHighestTemperature(message)
  {
    if(message.body.current_temperature > this.state.highest.temperature || this.state.highest.temperature === null)
    {
      return message.body.current_temperature;
    } 
    return this.state.highest.temperature;
  }
  getHighestHumidity(message)
  {
    if(message.body.humidity_level > this.state.highest.humidity || this.state.highest.humidity_level === null)
    {
      return message.body.humidity_level;
    } 
    return this.state.highest.humidity;
  }
  getHighestPressure(message)
  {
    if(message.body.pressure > this.state.highest.pressure || this.state.highest.pressure === null)
    {
      return message.body.pressure;
    } 
    return this.state.highest.pressure;
  }
  render() {
    return (
    <div className="App">
      <header className="App-header">
        <p>
          Updating in: {this.state.seconds} seconds <br /><br />
          Last Seen: {this.state.lastSeen.toString()}
        </p>
        <table>
          <tbody>
            <tr>
              <th>Device Status: {this.state.deviceStatus}</th>
              <th>| Temperature (C)</th>
              <th>| Humidity (%)</th>
              <th>| Pressure (psig) |</th>
            </tr>
            <tr>
              <td>Current</td>
              <td>{this.state.current.temperature}</td>
              <td>{this.state.current.humidity}</td>
              <td>{this.state.current.pressure}</td>
            </tr>
            <tr>
              <td>Lowest</td>
              <td>{this.state.lowest.temperature}</td>
              <td>{this.state.lowest.humidity}</td>
              <td>{this.state.lowest.pressure}</td>
            </tr>
            <tr>
              <td>Highest</td>
              <td>{this.state.highest.temperature}</td>
              <td>{this.state.highest.humidity}</td>
              <td>{this.state.highest.pressure}</td>
            </tr>
          </tbody>
         </table>
      </header>
    </div>
    )};
}

export default App;
