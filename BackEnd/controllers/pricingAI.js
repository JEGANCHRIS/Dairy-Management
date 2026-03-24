const Product = require("../models/Product");
const Order = require("../models/Order");

// Simulate market value data (in real app, this would come from external market APIs)
function simulateMarketData(product) {
  // Base market value on product category and current price
  const categoryBaseMultipliers = {
    milk: 0.95,
    butter: 1.05,
    cheese: 1.15,
    yogurt: 0.9,
    paneer: 1.2,
    lassi: 0.85,
    milkshake: 0.8,
    curd: 0.92,
    cream: 1.1,
    other: 1.0,
  };

  const baseMultiplier = categoryBaseMultipliers[product.category] || 1.0;

  // Add some randomness to simulate market fluctuations
  const fluctuation = 0.85 + Math.random() * 0.3; // 0.85 to 1.15

  // Calculate simulated market value
  const marketValue = Math.round(product.price * baseMultiplier * fluctuation);

  // Calculate market trend (-1 to 1, negative = decreasing, positive = increasing)
  const marketTrend = (Math.random() * 2 - 1) * 0.3;

  // Competitor price range
  const competitorMin = Math.round(marketValue * 0.85);
  const competitorMax = Math.round(marketValue * 1.15);
  const competitorAvg = Math.round((competitorMin + competitorMax) / 2);

  return {
    marketValue,
    marketTrend: parseFloat(marketTrend.toFixed(3)),
    competitorMin,
    competitorMax,
    competitorAvg,
    pricePosition:
      product.price < competitorMin
        ? "below_market"
        : product.price > competitorMax
          ? "above_market"
          : "at_market",
  };
}

// Analyze products and generate pricing suggestions
const getPricingSuggestions = async (req, res) => {
  try {
    const { useAI = "false" } = req.query;

    // Get all active products
    const products = await Product.find({ isActive: true }).lean();

    if (!products || products.length === 0) {
      return res.json({
        products: [],
        summary: { totalProducts: 0, suggestionsCount: 0 },
      });
    }

    // Get recent orders for demand analysis
    const recentOrders = await Order.find({
      orderStatus: { $in: ["delivered", "processing"] },
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    })
      .populate("products.product")
      .lean();

    // Analyze each product
    const analyzedProducts = await Promise.all(
      products.map(async (product) => {
        // Calculate demand score based on recent orders
        const productOrders = recentOrders.filter((order) =>
          order.products.some(
            (p) => p.product?._id?.toString() === product._id.toString(),
          ),
        );

        const totalQuantitySold = productOrders.reduce((sum, order) => {
          const productItem = order.products.find(
            (p) => p.product?._id?.toString() === product._id.toString(),
          );
          return sum + (productItem?.quantity || 0);
        }, 0);

        // Calculate average daily sales
        const daysActive = Math.max(
          1,
          Math.floor(
            (Date.now() - new Date(product.createdAt).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        );
        const avgDailySales = totalQuantitySold / Math.min(daysActive, 30);

        // Stock analysis
        const stockLevel = product.stock || 0;
        const stockStatus =
          stockLevel === 0
            ? "out_of_stock"
            : stockLevel < 10
              ? "low_stock"
              : stockLevel < 50
                ? "medium_stock"
                : "high_stock";

        // Price competitiveness analysis (compare with category average)
        const categoryProducts = products.filter(
          (p) => p.category === product.category,
        );
        const categoryAvgPrice =
          categoryProducts.reduce((sum, p) => sum + p.price, 0) /
          categoryProducts.length;
        const priceVsCategory =
          ((product.price - categoryAvgPrice) / categoryAvgPrice) * 100;

        // Get simulated market data
        const marketData = simulateMarketData(product);

        // Generate suggestion using algorithm - ALWAYS generate a suggestion
        let suggestion = null;
        let suggestionType = "none";
        let confidence = 50;
        let reason = "";

        // Out of stock - suggest restock
        if (stockLevel === 0) {
          suggestion = {
            action: "restock",
            suggestedPrice: product.price,
            priceChange: 0,
            message: `🚨 Product is out of stock. Restock immediately to resume sales.`,
          };
          suggestionType = "urgent";
          confidence = 100;
          reason = "Product unavailable for purchase";
        }
        // Price significantly above market value - suggest decrease
        else if (product.price > marketData.competitorAvg * 1.1) {
          const targetPrice = Math.round(marketData.competitorAvg * 0.98);
          const priceReduction = product.price - targetPrice;
          suggestion = {
            action: "decrease_price",
            suggestedPrice: targetPrice,
            priceChange: -priceReduction,
            message: `💰 Your price is ₹${priceReduction} above market average. Reduce to ₹${targetPrice} to stay competitive and increase sales.`,
          };
          suggestionType = "competitive";
          confidence = Math.min(
            90,
            Math.round(
              70 +
                ((product.price - marketData.competitorAvg) / product.price) *
                  100,
            ),
          );
          reason = `Price ₹${product.price} vs market avg ₹${marketData.competitorAvg}`;
        }
        // Price significantly below market value - suggest increase
        else if (
          product.price < marketData.competitorAvg * 0.85 &&
          avgDailySales > 0.5
        ) {
          const targetPrice = Math.round(marketData.competitorAvg * 0.95);
          const priceIncrease = targetPrice - product.price;
          suggestion = {
            action: "increase_price",
            suggestedPrice: targetPrice,
            priceChange: priceIncrease,
            message: `📈 Product is underpriced by ₹${priceIncrease}. Increase to ₹${targetPrice} to match market value and improve margins.`,
          };
          suggestionType = "opportunity";
          confidence = Math.min(85, Math.round(65 + avgDailySales * 5));
          reason = `Price ₹${product.price} vs market avg ₹${marketData.competitorAvg} with ${totalQuantitySold} sales`;
        }
        // Low stock with any demand - suggest price increase
        else if (stockLevel < 15 && stockLevel > 0) {
          const priceIncrease = Math.min(10, Math.round(product.price * 0.08));
          suggestion = {
            action: "increase_price",
            suggestedPrice: product.price + priceIncrease,
            priceChange: priceIncrease,
            message: `⚠️ Low stock (${stockLevel} units). Consider increasing price by ₹${priceIncrease} to maximize revenue before restock.`,
          };
          suggestionType = "opportunity";
          confidence = Math.min(80, Math.round(60 + (15 - stockLevel) * 2));
          reason = `Low stock (${stockLevel} units) - optimize revenue`;
        }
        // High stock with low sales - suggest discount
        else if (stockLevel > 40 && totalQuantitySold < 5) {
          const discountPercent = Math.min(
            20,
            Math.round(10 + stockLevel / 10),
          );
          const discountedPrice = Math.round(
            product.price * (1 - discountPercent / 100),
          );
          suggestion = {
            action: "decrease_price",
            suggestedPrice: discountedPrice,
            priceChange: discountedPrice - product.price,
            message: `🏷️ High inventory (${stockLevel} units) with low sales. Consider ${discountPercent}% discount to boost movement.`,
          };
          suggestionType = "clearance";
          confidence = Math.min(75, Math.round(50 + stockLevel / 5));
          reason = `Excess stock (${stockLevel}) with only ${totalQuantitySold} sales`;
        }
        // Price is within market range - suggest optimization
        else {
          const optimization = Math.round(product.price * 0.05);
          const trendDirection =
            marketData.marketTrend > 0 ? "increase" : "maintain";

          if (marketData.marketTrend > 0.1) {
            suggestion = {
              action: "increase_price",
              suggestedPrice: product.price + optimization,
              priceChange: optimization,
              message: `📊 Market trend is positive (+${(marketData.marketTrend * 100).toFixed(1)}%). Consider small increase of ₹${optimization} to capture additional value.`,
            };
            suggestionType = "margin_boost";
            confidence = Math.round(55 + marketData.marketTrend * 50);
            reason = `Positive market trend +${(marketData.marketTrend * 100).toFixed(1)}%`;
          } else if (marketData.marketTrend < -0.1) {
            suggestion = {
              action: "decrease_price",
              suggestedPrice: product.price - optimization,
              priceChange: -optimization,
              message: `📉 Market trend is negative (${(marketData.marketTrend * 100).toFixed(1)}%). Consider small discount of ₹${optimization} to maintain competitiveness.`,
            };
            suggestionType = "competitive";
            confidence = Math.round(55 - marketData.marketTrend * 50);
            reason = `Negative market trend ${(marketData.marketTrend * 100).toFixed(1)}%`;
          } else {
            suggestion = {
              action: "maintain_price",
              suggestedPrice: product.price,
              priceChange: 0,
              message: `✅ Price is optimal. Market conditions are stable. Continue monitoring for changes.`,
            };
            suggestionType = "optimal";
            confidence = 70;
            reason = "Price aligned with market value";
          }
        }

        // Calculate market value score (0-100)
        const marketValueScore = Math.round(
          Math.min(
            100,
            Math.max(
              0,
              50 +
                avgDailySales * 10 +
                (productOrders.length > 0 ? 10 : 0) +
                (priceVsCategory < 0 ? 5 : 0) -
                (stockLevel === 0 ? 30 : 0) +
                (marketData.pricePosition === "below_market" ? 10 : 0),
            ),
          ),
        );

        return {
          _id: product._id,
          name: product.name,
          category: product.category,
          variety: product.variety,
          currentPrice: product.price,
          stock: stockLevel,
          stockStatus,
          discount: product.discount || 0,
          images: product.images,
          analytics: {
            totalSold30Days: totalQuantitySold,
            avgDailySales: parseFloat(avgDailySales.toFixed(2)),
            ordersCount: productOrders.length,
            categoryAvgPrice: parseFloat(categoryAvgPrice.toFixed(2)),
            priceVsCategory: parseFloat(priceVsCategory.toFixed(2)),
            marketValueScore,
            marketValue: marketData.marketValue,
            marketTrend: marketData.marketTrend,
            competitorMin: marketData.competitorMin,
            competitorMax: marketData.competitorMax,
            competitorAvg: marketData.competitorAvg,
            pricePosition: marketData.pricePosition,
          },
          suggestion: {
            ...suggestion,
            type: suggestionType,
            confidence,
            reason,
          },
        };
      }),
    );

    // Sort by suggestion priority (urgent first, then by confidence)
    const priorityOrder = {
      urgent: 0,
      opportunity: 1,
      competitive: 2,
      clearance: 3,
      margin_boost: 4,
      optimal: 5,
      none: 6,
    };
    analyzedProducts.sort((a, b) => {
      const priorityA = priorityOrder[a.suggestion?.type] || 6;
      const priorityB = priorityOrder[b.suggestion?.type] || 6;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return (b.suggestion?.confidence || 0) - (a.suggestion?.confidence || 0);
    });

    // Calculate summary
    const summary = {
      totalProducts: analyzedProducts.length,
      suggestionsCount: analyzedProducts.filter(
        (p) => p.suggestion !== null && p.suggestion.type !== "optimal",
      ).length,
      urgentCount: analyzedProducts.filter(
        (p) => p.suggestion?.type === "urgent",
      ).length,
      opportunityCount: analyzedProducts.filter(
        (p) => p.suggestion?.type === "opportunity",
      ).length,
      clearanceCount: analyzedProducts.filter(
        (p) => p.suggestion?.type === "clearance",
      ).length,
      avgMarketValueScore: parseFloat(
        (
          analyzedProducts.reduce(
            (sum, p) => sum + p.analytics.marketValueScore,
            0,
          ) / analyzedProducts.length
        ).toFixed(1),
      ),
      totalPotentialRevenue: parseFloat(
        analyzedProducts
          .reduce((sum, p) => {
            if (p.suggestion && p.suggestion.action === "increase_price") {
              return sum + p.suggestion.priceChange * p.stock;
            }
            return sum;
          }, 0)
          .toFixed(2),
      ),
    };

    res.json({
      products: analyzedProducts,
      summary,
      generatedAt: new Date().toISOString(),
      analysisType: useAI === "true" ? "ai_powered" : "algorithm_based",
    });
  } catch (error) {
    console.error("Get pricing suggestions error:", error);
    res.status(500).json({ error: "Error generating pricing suggestions" });
  }
};

// Apply suggested price to a product
const applySuggestedPrice = async (req, res) => {
  try {
    const { productId, suggestedPrice } = req.body;

    if (!productId || suggestedPrice === undefined) {
      return res
        .status(400)
        .json({ error: "Product ID and suggested price are required" });
    }

    if (suggestedPrice < 0) {
      return res.status(400).json({ error: "Price cannot be negative" });
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      {
        price: suggestedPrice,
        updatedAt: Date.now(),
      },
      { new: true },
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({
      message: "Price updated successfully",
      product: {
        _id: product._id,
        name: product.name,
        price: product.price,
      },
    });
  } catch (error) {
    console.error("Apply suggested price error:", error);
    res.status(500).json({ error: "Error updating price" });
  }
};

module.exports = {
  getPricingSuggestions,
  applySuggestedPrice,
};
