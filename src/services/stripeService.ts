// Stripe.js ya no es necesario para redirección directa
// import { loadStripe } from '@stripe/stripe-js';
import { apiClient } from '../utils/apiClient';
import { ENDPOINTS, ROUTES } from '../config/api';
import type { 
  CreateCheckoutRequest, 
  CreateCheckoutResponse,
  ActiveSubscription,
  SubscriptionStatusResponse 
} from '../types';

// Verificar configuración de Stripe
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const isConfigured = stripePublicKey && stripePublicKey !== 'pk_test_YOUR_STRIPE_PUBLIC_KEY_HERE';

if (!isConfigured) {
  console.warn('⚠️ Stripe public key not configured in environment variables');
}

export const stripeService = {

  /**
   * Crea una sesión de checkout y redirige al usuario a Stripe
   * @param tierId - ID del tier de suscripción (Pro o Premium)
   */
  async createCheckoutSession(tierId: string): Promise<void> {
    try {
      // Construir request con las rutas configuradas
      const request: CreateCheckoutRequest = {
        tierId,
        // Las URLs se construirán en el backend usando AppUrls configurado
      };

      // Llamar al backend para crear la sesión
      const response: CreateCheckoutResponse = await apiClient.post(
        ENDPOINTS.STRIPE_CHECKOUT,
        request
      );

      // Redirigir directamente usando la URL de checkout
      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (error) {
      console.error('Checkout session error:', error);
      throw error;
    }
  },

  /**
   * Obtiene la suscripción activa del usuario
   */
  async getActiveSubscription(): Promise<ActiveSubscription | null> {
    try {
      const response: SubscriptionStatusResponse = await apiClient.get(
        ENDPOINTS.STRIPE_SUBSCRIPTION_ACTIVE
      );

      return response.hasActiveSubscription ? response.subscription : null;
    } catch (error) {
      console.error('Error fetching active subscription:', error);
      throw error;
    }
  },

  /**
   * Cancela la suscripción activa
   */
  async cancelSubscription(): Promise<{ message: string }> {
    try {
      return await apiClient.post(ENDPOINTS.STRIPE_SUBSCRIPTION_CANCEL, {});
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  },

  /**
   * Verifica si Stripe está configurado
   */
  isConfigured(): boolean {
    return isConfigured;
  }
};
