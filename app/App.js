import React from 'react';
import styles from './App.css';
import { Square } from './Square.js';
import uuid from 'uuid';
import io from 'socket.io-client';

const socket = io.connect('http://localhost:3000');

export default class App extends React.Component {
  constructor(props) {
    super(props);
    const board = this.createBoard(15, 15);
    this.state = { 
      board,
      status: 'Waiting for players to connect'
    };
  }

  componentDidMount() {
    socket.on('game:updateBoard', this.updateBoard.bind(this));
    socket.on('game:status', this.updateStatus.bind(this));
  }

  createBoard(rows, cols) {
    let res = [];
    for (let r = 0; r < rows; r++) {
      let row = Array.from('.'.repeat(cols));
      res.push(row);
    }
    return res;
  }

  updateBoard(board) {
    this.setState({ board });
  }

  updateStatus(status) {
    const board = this.state.board;
    this.setState({ board, status }); 
  }

  handleOnClick(coords) {
    socket.emit('game:checkCoordinates', coords, (board) => {
      this.setState({ board });
    });
  }


  render() {
    const { board, status } = this.state;

    return (
      <div className={styles.app}>
        <span className="test">{status}</span>
        <div className={styles.board}>
          {board.map((row, r) => {
            return (
              <div key={uuid.v1()} className={styles.row}> 
                {row.map((col, c) => {
                  return (
                    <div key={uuid.v1()} onClick={() => this.handleOnClick({r,c})}>
                      <Square data={col} />
                    </div>
                  );
                })}
              </div>
            ); 
          })}
        </div>
      </div>
    );
  }
}
