import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CompanyDetail, CompanyNews } from '@/types';
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Clock, Star, Filter } from 'lucide-react';
import { useState } from 'react';

interface CompanyNewsTabProps {
  company: CompanyDetail;
  news?: CompanyNews[];
}

type TimeFilter = '7' | '30' | '90';

export function CompanyNewsTab({ company, news }: CompanyNewsTabProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30');
  
  if (!news || news.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Newspaper className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Recent News</h3>
          <p className="text-gray-600">No recent news articles found for {company.name}.</p>
        </CardContent>
      </Card>
    );
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      case 'neutral': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="h-3 w-3" />;
      case 'negative': return <TrendingDown className="h-3 w-3" />;
      default: return null;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  // Filter news by time range
  const filterByTime = (articles: CompanyNews[], days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return articles.filter(article => new Date(article.published_at) >= cutoffDate);
  };

  const filteredNews = filterByTime(news, parseInt(timeFilter));
  const sortedNews = [...filteredNews].sort((a, b) => {
    // Sort by relevance score first, then by date
    if (a.relevance_score !== b.relevance_score) {
      return b.relevance_score - a.relevance_score;
    }
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Time Filter Pills */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Recent News Coverage
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <div className="flex gap-1">
                {(['7', '30', '90'] as TimeFilter[]).map((days) => (
                  <Button
                    key={days}
                    variant={timeFilter === days ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeFilter(days)}
                    className="text-xs"
                  >
                    {days} days
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-semibold">{sortedNews.length}</p>
              <p className="text-sm text-gray-600">Articles (Last {timeFilter} days)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-green-600">
                {sortedNews.filter(n => n.sentiment === 'positive').length}
              </p>
              <p className="text-sm text-gray-600">Positive</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-red-600">
                {sortedNews.filter(n => n.sentiment === 'negative').length}
              </p>
              <p className="text-sm text-gray-600">Negative</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* News Articles */}
      <div className="space-y-4">
        {sortedNews.map((article) => (
          <Card key={article.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {article.source}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs text-gray-600">
                          {article.relevance_score}/100
                        </span>
                      </div>
                      {/* Relevance Bar */}
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${article.relevance_score}%` }}
                        />
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getSentimentColor(article.sentiment)}`}
                    >
                      <span className="flex items-center gap-1">
                        {getSentimentIcon(article.sentiment)}
                        {article.sentiment}
                      </span>
                    </Badge>
                  </div>

                  <h3 className="text-lg font-semibold mb-2 leading-tight">
                    {article.headline}
                  </h3>

                  {article.summary && (
                    <p className="text-gray-700 mb-3 leading-relaxed">
                      {article.summary}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>{formatTimeAgo(article.published_at)}</span>
                    </div>

                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        Read Full Article
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {sortedNews.length >= 10 && (
        <div className="text-center">
          <Button variant="outline">
            Load More Articles
          </Button>
        </div>
      )}
      
      {/* No articles for filter */}
      {sortedNews.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Newspaper className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Articles Found</h3>
            <p className="text-gray-600">No articles found for the selected time period. Try a different filter.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
