import React from 'react';
import Styles from './App.css';

export const Square = (props) => {
  let item = '';
  if (props.data === 'x') {
    item = <Cross />;
  } else if (props.data === 'o') {
    item = <Circle />;
  }
  return (
    <div className={Styles.square}>{item}</div>
  )
}

const Circle = () => {
  const style = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: 'red'
  }
  return <div style={style}>&#11096;</div>;
}

const Cross = () => {
  const style = {
    color: 'blue'
  }
  return <div style={style}>&#10060;</div>;
}