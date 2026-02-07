"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ru';

type Dictionary = {
    [key: string]: string | Dictionary;
};

const dictionaries: Record<Language, Dictionary> = {
    en: {
        auth: {
            loginTitle: "Login",
            loginDesc: "Enter your credentials to access the admin panel.",
            emailLabel: "Email",
            passwordLabel: "Password",
            loginButton: "Login",
            loggingIn: "Logging in...",
            noAccount: "Don't have an account?",
            registerLink: "Register",
            registerTitle: "Register Shop",
            registerDesc: "Create a new account and shop.",
            shopNameLabel: "Shop Name",
            registerButton: "Register",
            creating: "Creating...",
            hasAccount: "Already have an account?",
            loginLink: "Login",
        },
        nav: {
            dashboard: "Analytics",
            products: "Products",
            categories: "Categories",
            orders: "Orders",
            botConfig: "Bot Config",
            marketing: "Marketing",
            logout: "Logout",
        },
        common: {
            welcome: "Welcome",
            managerDashboard: "Manager Dashboard",
            myShop: "My Shop",
            name: "Name",
            status: "Status",
            quickStats: "Quick Stats",
            orders: "Orders",
            revenue: "Revenue",
            active: "Active",
            inactive: "Inactive",
        },
        bot: {
            title: "Bot Configuration",
            tokenLabel: "Bot Token",
            tokenPlaceholder: "Enter your bot token from @BotFather",
            saveButton: "Save & Connect",
            webhookStatus: "Webhook Status",
            connectedAs: "Connected as",
            notConnected: "Not connected",
            setWebhookSuccess: "Webhook set successfully!",
            invalidToken: "Invalid Token",
            statusActive: "Active",
            statusInactive: "Inactive",
        },
        categories: {
            title: "Categories",
            add: "Add Category",
            name: "Category Name",
            count: "Products",
            edit: "Edit",
            delete: "Delete",
            save: "Save Category",
            deleteTitle: "Delete Category?",
            deleteDesc: "This partition will be permanently deleted. Products will remain but will be uncategorized.",
            cancel: "Cancel",
            confirm: "Delete",
            empty: "No categories found. Create one!",
        },
        products: {
            title: "Products",
            add: "Add Product",
            edit: "Edit Product",
            name: "Product Name",
            price: "Price",
            stock: "Stock",
            category: "Category",
            description: "Description",
            image: "Image",
            status: "Status",
            save: "Save Product",
            deleteTitle: "Delete Product?",
            deleteDesc: "This product will be permanently deleted.",
            empty: "No products found. Start selling!",
            uploadImage: "Upload Image",
            uploading: "Uploading...",
            dropImage: "Drop image here or click to upload"
        }
    },
    ru: {
        auth: {
            loginTitle: "Вход",
            loginDesc: "Введите данные для доступа к админ-панели.",
            emailLabel: "Email",
            passwordLabel: "Пароль",
            loginButton: "Войти",
            loggingIn: "Входим...",
            noAccount: "Нет аккаунта?",
            registerLink: "Регистрация",
            registerTitle: "Регистрация Магазина",
            registerDesc: "Создайте новый аккаунт и магазин.",
            shopNameLabel: "Название магазина",
            registerButton: "Зарегистрироваться",
            creating: "Создаем...",
            hasAccount: "Уже есть аккаунт?",
            loginLink: "Войти",
        },
        nav: {
            dashboard: "Аналитика",
            products: "Товары",
            categories: "Категории",
            orders: "Заказы",
            botConfig: "Настройки Бота",
            marketing: "Маркетинг",
            logout: "Выйти",
        },
        common: {
            welcome: "Добро пожаловать",
            managerDashboard: "Панель Менеджера",
            myShop: "Мой Магазин",
            name: "Название",
            status: "Статус",
            quickStats: "Быстрая Статистика",
            orders: "Заказы",
            revenue: "Выручка",
            active: "Активен",
            inactive: "Неактивен",
        },
        bot: {
            title: "Настройки Бота",
            tokenLabel: "Токен Бота",
            tokenPlaceholder: "Введите токен от @BotFather",
            saveButton: "Сохранить и Подключить",
            webhookStatus: "Статус Вебхука",
            connectedAs: "Подключен как",
            notConnected: "Не подключен",
            setWebhookSuccess: "Вебхук успешно установлен!",
            invalidToken: "Неверный токен",
            statusActive: "Активен",
            statusInactive: "Неактивен",
        },
        categories: {
            title: "Категории",
            add: "Добавить Категорию",
            name: "Название",
            count: "Товары",
            edit: "Изменить",
            delete: "Удалить",
            save: "Сохранить",
            deleteTitle: "Удалить категорию?",
            deleteDesc: "Этот раздел будет удален навсегда. Товары останутся, но будут без категории.",
            cancel: "Отмена",
            confirm: "Удалить",
            empty: "Категории не найдены. Создайте первую!",
        },
        products: {
            title: "Товары",
            add: "Добавить Товар",
            edit: "Изменить Товар",
            name: "Название",
            price: "Цена",
            stock: "Остаток",
            category: "Категория",
            description: "Описание",
            image: "Изображение",
            status: "Статус",
            save: "Сохранить",
            deleteTitle: "Удалить товар?",
            deleteDesc: "Этот товар будет удален навсегда.",
            empty: "Товары не найдены. Начните продажи!",
            uploadImage: "Загрузить фото",
            uploading: "Загрузка...",
            dropImage: "Перетащите фото сюда или нажмите"
        }
    }
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en'); // Default to English initially
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('language') as Language;
        if (saved && (saved === 'en' || saved === 'ru')) {
            setLanguage(saved);
        }
        setMounted(true);
    }, []);

    const changeLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
    };

    const t = (path: string) => {
        const keys = path.split('.');
        let current: any = dictionaries[language];
        for (const key of keys) {
            if (current[key] === undefined) return path;
            current = current[key];
        }
        return typeof current === 'string' ? current : path;
    };



    return (
        <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
