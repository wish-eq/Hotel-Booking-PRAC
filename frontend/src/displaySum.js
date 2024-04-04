function displaySum() {
  let firstNum = Number(document.getElementById("firstNum").innerHTML);
  let secondNum = Number(document.getElementById("secondNum").innerHTML);
  let total = firstNum + secondNum;
  document.getElementById("answer").innerHTML = `equals to ${total}`;
}

document.getElementById("sumButton").addEventListener("click", displaySum);
