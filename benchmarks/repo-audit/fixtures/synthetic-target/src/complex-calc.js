/**
 * Computational logic with extreme cyclomatic complexity (> 15 decision branches).
 */
function calculateDynamicDiscount(userTier, purchaseAmount, couponCode, isHoliday, isFirstPurchase, paymentMethod) {
  let discount = 0;

  if (userTier === 'VIP') {
    if (purchaseAmount > 500) {
      if (isHoliday) {
        discount += 0.25;
      } else if (isFirstPurchase) {
        discount += 0.20;
      } else {
        discount += 0.15;
      }
    } else if (purchaseAmount > 200) {
      if (couponCode === 'SPRING') {
        discount += 0.12;
      } else if (couponCode === 'FALL') {
        discount += 0.10;
      } else {
        discount += 0.08;
      }
    } else {
      discount += 0.05;
    }
  } else if (userTier === 'REGULAR') {
    if (purchaseAmount > 300) {
      if (isHoliday) {
        discount += 0.10;
      } else {
        discount += 0.05;
      }
    } else if (couponCode === 'WELCOME') {
      discount += 0.07;
    }
  } else {
    if (isFirstPurchase && couponCode) {
      discount += 0.03;
    } else if (paymentMethod === 'CRYPTO') {
      discount += 0.01;
    }
  }

  return discount;
}

module.exports = { calculateDynamicDiscount };
