//+------------------------------------------------------------------+
//|                                                 EA Templates.mq5 |
//|                                  Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Developed by Andrei"
#property link      "https://www.forexfactory.com/andreiwn"
#property version   "1.00"

#include <Trade\Trade.mqh>
CTrade trade;

input group "=== Geral ===";
input bool InpAllowLong = true; // Allow Long
input bool InpAllowShort = true; // Allow Short
input double InpRiskAmount = 100.0; // Risk Amount
input double InpFixedLot = 0; // Fixed Lot Size

input group "=== Posições ===";
input double InpTakeMultiplier = 1.0; // Take Profit Multiplier (Based on ATR)
input double InpStopMultiplier = 1.0; // Stop Loss Multiplier (Based on ATR)
input double InpTSLMultiplier = 1.0; // Traling Stop Multiplier 0=Off (Based on ATR)
input bool InpReverseTrading = false; // Reverse Trading

input group "=== ATR ===";
input int InpATRPeriod = 50; // ATR Period

input group "=== Indicators ===";
input ENUM_TIMEFRAMES InpTimeframe = PERIOD_D1; // Timeframe
input int InpSessionStart = 4; // Session Start
input int InpSessionEnd = 10; // Session End

string Comentario = "#0068";
ulong BuyTicket, SellTicket;
int TotalBars, TotalDailyBars;
MqlTick TickInfo;

bool BuyEntryToday, SellEntryToday;

int ATRHandle, MAHandle, MATwoHandle, MAThreeHandle, MAFourHandle, MAFiveHandle;
double ATRValue[], MAValue[], MATwoValue[], MAThreeValue[], MAFourValue[], MAFiveValue[];

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
//---
   ATRHandle = iATR(_Symbol, InpTimeframe, InpATRPeriod);

   if(!CheckInputs())
     {
      return(INIT_FAILED);
     }
//---
   return(INIT_SUCCEEDED);
  }
//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
//---

  }
//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
  {
//---
   CopyBuffer(ATRHandle, 0, 1, 1, ATRValue);

   SymbolInfoTick(_Symbol, TickInfo);
   LoadOpenPositions(BuyTicket, "BUY");
   LoadOpenPositions(SellTicket, "SELL");

   int dailyBars = iBars(_Symbol, PERIOD_D1);
   if(TotalDailyBars != dailyBars)
     {
      TotalDailyBars = dailyBars;
      BuyEntryToday = false;
      SellEntryToday = false;
     }

   int bars = iBars(_Symbol, PERIOD_CURRENT);
   if(TotalBars != bars)
     {
      TotalBars = bars;

      ExecuteTralingStop(BuyTicket);
      ExecuteTralingStop(SellTicket);

      bool UpSessionBreak = TickInfo.ask >= iHigh(_Symbol, InpTimeframe, 0);
      bool DownSessionBreak = TickInfo.ask <= iLow(_Symbol, InpTimeframe, 0);

      MqlDateTime structTime;
      TimeToStruct(TimeCurrent(), structTime);
      bool allowTradingTime = (structTime.hour >= InpSessionStart && structTime.hour <= InpSessionEnd);

      bool BuyCondition = UpSessionBreak && BuyTicket <= 0 && SellTicket <= 0 && !BuyEntryToday && InpAllowLong && allowTradingTime;
      bool SellCondition = DownSessionBreak && BuyTicket <= 0 && SellTicket <= 0 && !SellEntryToday && InpAllowShort && allowTradingTime;

      if(BuyCondition)
        {
         if(InpReverseTrading)
           {
            ExecuteSell();
           }
         else
           {
            ExecuteBuy();
           }
        }
      if(SellCondition)
        {
         if(InpReverseTrading)
           {
            ExecuteBuy();
           }
         else
           {
            ExecuteSell();
           }
        }
     }
  }
//+------------------------------------------------------------------+
void ExecuteBuy()
  {
   double sl = TickInfo.ask - (ATRValue[0] * InpStopMultiplier);
   double tp = TickInfo.ask + (ATRValue[0] * InpTakeMultiplier);
   double lot = InpFixedLot > 0 ? InpFixedLot : CalculateLotSize(TickInfo.ask, sl, InpRiskAmount);
   BuyEntryToday = true;

   trade.Buy(lot, NULL, 0, sl, tp, Comentario);
   BuyTicket = trade.ResultOrder();
  }

void ExecuteSell()
  {
   double sl = TickInfo.ask + (ATRValue[0] * InpStopMultiplier);
   double tp = TickInfo.ask - (ATRValue[0] * InpTakeMultiplier);
   double lot = InpFixedLot > 0 ? InpFixedLot : CalculateLotSize(TickInfo.ask, sl, InpRiskAmount);
   SellEntryToday = true;

   trade.Sell(lot, NULL, 0, sl, tp, Comentario);
   SellTicket = trade.ResultOrder();
  }


  void ExecutePendingSell(double entryPrice) {
   double atrValue = ATRValue[0];
   double sl = entryPrice + (atrValue * InpStopMultiplier);
   double tp = entryPrice - (atrValue * InpTakeMultiplier);
   double lot = InpFixedLot > 0 ? InpFixedLot : CalculateLotSize(entryPrice, sl, InpRiskAmount);
   
   datetime expiration = TimeCurrent() + PeriodSeconds(InpTimeframe) * 3;
   
   trade.SellStop(lot, entryPrice, _Symbol, sl, tp, ORDER_TIME_SPECIFIED, expiration, Comentario);
   SellTicket = trade.ResultOrder();
}

void LoadOpenPositions(ulong &posTicket, string direction) {
   if(PositionsTotal() == 0 && OrdersTotal() == 0){
      posTicket = 0;
   }
   
   //Print("Total Orders: ", OrdersTotal());
   
   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      ulong ticket = PositionGetTicket(i);

      if(PositionSelectByTicket(ticket)) {
         string posSymbol = PositionGetString(POSITION_SYMBOL);
         long tradeDirection = PositionGetInteger(POSITION_TYPE);

         if(posSymbol == _Symbol) {
            if((direction == "BUY" && tradeDirection == POSITION_TYPE_BUY)) {
               posTicket = ticket;
               return;

            } else if(direction == "SELL" && tradeDirection == POSITION_TYPE_SELL) {
               posTicket = ticket;
               return;

            }
         }
      }
   }
   for(int i = OrdersTotal()-1; i >= 0; i--) {
      ulong ticket;
      if((ticket = OrderGetTicket(i)) > 0) {
         string posSymbol = OrderGetString(ORDER_SYMBOL);
         long tradeDirection = OrderGetInteger(ORDER_TYPE);
         if(posSymbol == _Symbol) {
            if(direction == "BUY" && tradeDirection == ORDER_TYPE_BUY_STOP) {
               posTicket = ticket;
               Print("Ticket From Order: ", ticket);
               return;
            } else if(direction == "SELL" && tradeDirection == ORDER_TYPE_SELL_STOP) {
               posTicket = ticket;
               return;
            }
         }
      }
   }
   posTicket = 0;
}

void ExecutePendingBuy(double entryPrice) {
   double atrValue = ATRValue[0];
   double sl = entryPrice - (atrValue * InpStopMultiplier);
   double tp = entryPrice + (atrValue * InpTakeMultiplier);
   double lot = InpFixedLot > 0 ? InpFixedLot : CalculateLotSize(entryPrice, sl, InpRiskAmount);
   
   datetime expiration = TimeCurrent() + PeriodSeconds(InpTimeframe) * 3;
   
   trade.BuyStop(lot, entryPrice, _Symbol, sl, tp, ORDER_TIME_SPECIFIED, expiration, Comentario);
   BuyTicket = trade.ResultOrder();
}

void VerifyTicket(ulong &ticket)
  {
   if(ticket <= 0)
     {
      return;
     }

   CPositionInfo pos;

   if(!pos.SelectByTicket(ticket))
     {
      ticket = 0;
      return;
     }
  }

void ExecuteTralingStop(ulong &ticket)
  {
   if(ticket <= 0)
     {
      return;
     }
   if(InpTSLMultiplier <= 0)
     {
      return;
     }

   CPositionInfo pos;

   double TslTriggerPoints = (ATRValue[0] / _Point) * InpTSLMultiplier;
   double TslPoints = (ATRValue[0] / _Point) * InpTSLMultiplier;

   if(!pos.SelectByTicket(ticket))
     {
      return;
     }
   else
     {
      if(pos.PositionType() == POSITION_TYPE_BUY)
        {
         double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);

         if(bid > pos.PriceOpen() + TslTriggerPoints * _Point)
           {
            double sl = bid - TslPoints * _Point;
            sl = NormalizeDouble(sl, _Digits);

            if(sl > pos.StopLoss())
              {
               trade.PositionModify(pos.Ticket(), sl, pos.TakeProfit());
              }
           }
        }
      else
         if(pos.PositionType() == POSITION_TYPE_SELL)
           {
            double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);

            if(ask < pos.PriceOpen() - TslTriggerPoints * _Point)
              {
               double sl = ask + TslPoints * _Point;
               sl = NormalizeDouble(sl, _Digits);

               if(sl < pos.StopLoss() || pos.StopLoss() == 0)
                 {
                  trade.PositionModify(pos.Ticket(), sl, pos.TakeProfit());
                 }
              }
           }
     }
  }

double CheckVolume(double LotSize)
  {

   double minVolume = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxVolume = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);

   if(LotSize < minVolume)
     {
      return minVolume;
     }
   if(LotSize > maxVolume)
     {
      return maxVolume;
     }

   return LotSize;
  }

double CalculateLotSize(double entryPrice, double stopLoss, double riskAmount)
{
   if(entryPrice <= 0 || stopLoss <= 0 || riskAmount <= 0)
   {
      Print("Error: Invalid input parameters");
      return 0;
   }

   // Obtém o tamanho do contrato do símbolo
   double contractSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_CONTRACT_SIZE);
   if(contractSize <= 0)
   {
      Print("Error: Invalid contract size");
      return 0;
   }

   // Calcula a distância em pontos entre entrada e stop loss
   double pointsRisk = MathAbs(entryPrice - stopLoss);
   if(pointsRisk == 0)
   {
      Print("Error: Risk in points cannot be zero");
      return 0;
   }

   // Para forex, 1 lote = 100,000 unidades da moeda base
   // O valor por ponto depende do par de moedas e do tamanho do contrato
   double valuePerPoint;
   
   // Se for par com USD como moeda de cotação
   if(StringFind(_Symbol, "USD", 3) != -1)
   {
      valuePerPoint = contractSize;
   }
   // Se for par com USD como moeda base
   else if(StringFind(_Symbol, "USD") == 0)
   {
      valuePerPoint = contractSize / entryPrice;
   }
   // Para outros pares, converter através do USDXXX
   else
   {
      string usdPair = "USD" + StringSubstr(_Symbol, 3);
      double usdRate = SymbolInfoDouble(usdPair, SYMBOL_BID);
      if(usdRate <= 0) usdRate = 1;
      valuePerPoint = contractSize / usdRate;
   }

   // Calcula o tamanho do lote baseado no risco desejado
   double lotSize = riskAmount / (pointsRisk * valuePerPoint);

   // Obtém os limites de lote do símbolo
   double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double lotStep = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);

   // Arredonda para o tamanho de lote válido mais próximo
   lotSize = MathFloor(lotSize / lotStep) * lotStep;
   lotSize = NormalizeDouble(lotSize, 2);

   // Garante que o tamanho do lote está dentro dos limites permitidos
   if(lotSize < minLot)
      lotSize = minLot;
   else if(lotSize > maxLot)
      lotSize = maxLot;

   Print("Risk Amount: $", riskAmount);
   Print("Points Risk: ", pointsRisk);
   Print("Value per Point: $", valuePerPoint);
   Print("Contract Size: ", contractSize);
   Print("Calculated Lot Size: ", lotSize);

   return lotSize;
}


bool CheckInputs()
  {
   if(InpSessionStart < 0 || InpSessionStart > 23 || InpSessionEnd < 0 || InpSessionEnd > 23)
     {
      Print("Error: Invalid session start or end time");
      return false;
     }
   if(InpSessionStart >= InpSessionEnd)
     {
      Print("Error: Session start time must be less than session end time");
      return false;
     }
   return true;
  }
//+------------------------------------------------------------------+
