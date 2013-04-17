Willowmap::Application.routes.draw do
  get "static_pages/index"

  get "static_pages/map"

  authenticated :user do
    root :to => 'home#index'
  end
  root :to => "home#index"
  devise_for :users
  resources :users
end